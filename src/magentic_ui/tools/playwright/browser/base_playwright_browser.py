from __future__ import annotations
import asyncio
from types import TracebackType
from typing import AsyncContextManager, Optional, Type
from typing_extensions import Self
from abc import ABC, abstractmethod
from autogen_core import ComponentBase
from pydantic import BaseModel
from docker.errors import DockerException
from docker.models.containers import Container
from playwright.async_api import (
    BrowserContext,
    Playwright,
    Browser,
    async_playwright,
)

from loguru import logger


async def check_connectivity(host: str, port: int, timeout: float = 5.0) -> tuple[bool, str]:
    """Test if a host:port is reachable via TCP connection."""
    import socket
    try:
        # Test IPv4 connectivity
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        
        if result == 0:
            return True, f"TCP connection to {host}:{port} successful"
        else:
            return False, f"TCP connection to {host}:{port} failed with error code {result}"
    except Exception as e:
        return False, f"TCP connection test failed: {e}"


async def connect_browser_with_retry(
    playwright: Playwright, url: str, timeout: int = 30
) -> Browser:
    """Wait for the WebSocket server to be ready."""
    import re
    import urllib.parse
    
    # Force IPv4 localhost resolution to avoid IPv6/IPv4 connectivity issues
    # This only affects host->container connections, not container->container connections
    original_url = url
    if "localhost" in url and not url.startswith("ws://magentic-ui-"):
        # Only force IPv4 for localhost URLs, not for container-to-container communication
        # Container names typically start with "magentic-ui-" so we preserve those
        url = url.replace("localhost", "127.0.0.1")
        logger.info(f"Forcing IPv4 for localhost connection: {original_url} -> {url}")
    
    # Parse URL to get host and port for connectivity testing
    parsed = urllib.parse.urlparse(url)
    host = parsed.hostname or "localhost"
    port = parsed.port or 80
    
    start_time = asyncio.get_event_loop().time()
    retry_count = 0
    max_retries = min(timeout // 2, 15)  # Maximum 15 retries
    
    # Test basic connectivity first
    logger.info(f"Testing connectivity to {host}:{port}")
    can_connect, conn_message = await check_connectivity(host, port, timeout=3.0)
    logger.info(conn_message)
    
    if not can_connect and retry_count == 0:
        logger.warning("Basic TCP connectivity test failed - the server may not be ready yet")
    
    while asyncio.get_event_loop().time() - start_time < timeout and retry_count < max_retries:
        try:
            logger.info(f"Attempting to connect to browser at {url} (attempt {retry_count + 1}/{max_retries})")
            return await playwright.chromium.connect(url)
        except Exception as e:
            retry_count += 1
            elapsed = asyncio.get_event_loop().time() - start_time
            logger.warning(f"Connection failed: {type(e).__name__}: {e}. Retrying")
            
            # Use exponential backoff with jitter, but cap at 3 seconds
            import random
            base_delay = min(2 ** (retry_count - 1), 3)
            jitter = random.uniform(0.1, 0.5)
            delay = base_delay + jitter
            
            # Don't wait if we're close to the timeout
            if elapsed + delay < timeout:
                await asyncio.sleep(delay)
            else:
                logger.warning(f"Skipping delay due to approaching timeout (elapsed: {elapsed:.1f}s)")
                
    # Final diagnostic information
    final_connectivity, final_message = await check_connectivity(host, port, timeout=1.0)  
    logger.error(f"Final connectivity test: {final_message}")
    
    error_msg = f"Browser did not become available in time after {retry_count} attempts over {timeout}s"
    if not final_connectivity:
        error_msg += f". Network connectivity to {host}:{port} failed - check if the browser container is running and ports are correctly mapped."
    
    raise TimeoutError(error_msg)


class PlaywrightBrowser(
    AsyncContextManager["PlaywrightBrowser"], ABC, ComponentBase[BaseModel]
):
    """
    Abstract base class for Playwright browser.
    """

    def __init__(self):
        self._closed: bool = False

    @abstractmethod
    async def _start(self) -> None:
        """
        Start the browser resource.
        """
        pass

    @abstractmethod
    async def _close(self) -> None:
        """
        Close the browser resource.
        """
        pass

    # Expose playwright context
    @property
    @abstractmethod
    def browser_context(self) -> BrowserContext:
        """
        Return the Playwright browser context.
        """
        pass

    async def __aenter__(self) -> Self:
        """
        Start the Playwright browser.

        Returns:
            Self: The current instance of PlaywrightBrowser
        """
        await self._start()
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_value: Optional[BaseException],
        traceback: Optional[TracebackType],
    ) -> None:
        """Stop the browser.

        This method attempts a graceful termination first by sending SIGTERM,
        and if that fails, it forces termination with SIGKILL. It ensures
        the browser is properly cleaned up.
        """

        if not self._closed:
            # Close the browser resource
            await self._close()
            self._closed = True


class DockerPlaywrightBrowser(PlaywrightBrowser):
    """
    Base class for Docker Playwright Browser
    """

    def __init__(self):
        super().__init__()
        self._container: Optional[Container] = None
        self._playwright: Playwright | None = None
        self._context: BrowserContext | None = None

    @property
    def browser_address(self) -> str:
        raise NotImplementedError()

    @property
    def browser_context(self) -> BrowserContext:
        """
        Return the Playwright browser context.
        This is a placeholder implementation and should be overridden in subclasses.
        """
        if self._context is None:
            raise RuntimeError(
                "Browser context is not initialized. Start the browser first."
            )
        return self._context

    @abstractmethod
    async def create_container(self) -> Container:
        pass

    @abstractmethod
    def _generate_new_browser_address(self) -> None:
        """
        Generate a new address for the Playwright browser. Used if the current address fails to connect.
        """
        pass

    def _close_container(self) -> None:
        if self._container:
            self._container.stop(timeout=10)
            self._container = None

    async def _close(self) -> None:
        """
        Close the browser resource.
        This is a placeholder implementation and should be overridden in subclasses.
        """
        logger.info("Closing browser...")
        if self._context:
            await self._context.close()

        if self._browser:
            await self._browser.close()

        if self._playwright:
            await self._playwright.stop()

        self._close_container()

    async def _start(self) -> None:
        """
        Start a headless Playwright browser using the official Playwright Docker image.
        """
        retries = 0
        while True:
            self._container = await self.create_container()
            try:
                await asyncio.to_thread(self._container.start)
                # Give the container some time to initialize all services
                # This is especially important for the VNC browser which has multiple services
                logger.info("Container started, waiting for services to initialize...")
                await asyncio.sleep(3)  # Wait for services to start up
                break
            except DockerException as e:
                # This throws an exception.. should we try/catch this as well?
                # self._close_container()
                # Try 3 times, then give up
                retries += 1
                if retries >= 3:
                    raise
                self._generate_new_browser_address()
                logger.warning(
                    f"Failed to start container: {e}.\nRetrying with new address: {self.browser_address}"
                )

        browser_address = self.browser_address
        logger.info(f"Browser started at {browser_address}")

        self._playwright = await async_playwright().start()
        logger.info(f"Connecting to browser at {browser_address}")
        self._browser = await connect_browser_with_retry(
            self._playwright, browser_address, timeout=45  # Increased timeout for Docker startup
        )
        logger.info("Connected to browser")
        self._context = await self._browser.new_context()
