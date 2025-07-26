from __future__ import annotations

import asyncio
import logging
import os

from pathlib import Path
import secrets
import socket
from autogen_core import Component
import docker
from docker.models.containers import Container
from pydantic import BaseModel

from .base_playwright_browser import DockerPlaywrightBrowser
from ...._docker import BROWSER_IMAGE
from playwright.async_api import async_playwright


# Configure logging
logger = logging.getLogger(__name__)


class VncDockerPlaywrightBrowserConfig(BaseModel):
    """
    Configuration for the VNC Docker Playwright Browser.
    """

    bind_dir: Path
    image: str = BROWSER_IMAGE
    playwright_port: int = 37367
    novnc_port: int = 6080
    playwright_websocket_path: str | None = None
    inside_docker: bool = True
    network_name: str = "my-network"


class VncDockerPlaywrightBrowser(
    DockerPlaywrightBrowser, Component[VncDockerPlaywrightBrowserConfig]
):
    """
    A Docker-based Playwright browser implementation with VNC support for visual interaction.
    Provides both programmatic browser control via Playwright and visual access through noVNC.
    All sessions share the same container and ports, but should use separate browser contexts/pages.
    """

    component_config_schema = VncDockerPlaywrightBrowserConfig
    component_type = "other"

    # Static/shared settings
    DEFAULT_PLAYWRIGHT_PORT = 37367
    DEFAULT_NOVNC_PORT = 6080
    DEFAULT_WS_PATH = "ws"
    DEFAULT_CONTAINER_NAME = "magentic-ui-vnc-browser-shared"

    def __init__(
        self, *, bind_dir: Path, image: str = BROWSER_IMAGE, playwright_port: int = None,
                 playwright_websocket_path: str | None = None, novnc_port: int = None,
                 inside_docker: bool = True, network_name: str = "my-network"
    ):
        super().__init__()
        self._bind_dir = bind_dir
        self._image = image

        self._playwright_port = int(os.getenv("MAGENTIC_UI_PLAYWRIGHT_PORT", playwright_port or self.DEFAULT_PLAYWRIGHT_PORT))
        self._novnc_port = int(os.getenv("MAGENTIC_UI_NOVNC_PORT", novnc_port or self.DEFAULT_NOVNC_PORT))
        self._playwright_host = os.getenv("MAGENTIC_UI_PLAYWRIGHT_HOST", "127.0.0.1")
        self._novnc_host = os.getenv("MAGENTIC_UI_NOVNC_HOST", "127.0.0.1")
        self._playwright_websocket_path = playwright_websocket_path or self.DEFAULT_WS_PATH
        self._inside_docker = inside_docker
        self._network_name = network_name

        # Add these lines:
        self._playwright_ws_scheme = os.getenv("MAGENTIC_UI_PLAYWRIGHT_WS_SCHEME", "ws")
        self._novnc_scheme = os.getenv("MAGENTIC_UI_NOVNC_SCHEME", "http")

    @property
    def browser_address(self) -> str:
        """
        Get the address of the Playwright browser.
        """
        return f"{self._playwright_ws_scheme}://{self._playwright_host}:{self._playwright_port}/{self._playwright_websocket_path}"

    @property
    def vnc_address(self) -> str:
        """
        Get the address of the noVNC server.
        """
        port = self._novnc_port
        # If using standard HTTPS, don't append :443
        if self._novnc_scheme == "https" and str(port) == "443":
            return f"{self._novnc_scheme}://{self._novnc_host}/vnc.html"
        return f"{self._novnc_scheme}://{self._novnc_host}:{port}/vnc.html"

    @property
    def novnc_port(self) -> int:
        return self._novnc_port

    @property
    def playwright_port(self) -> int:
        return self._playwright_port

    async def _start(self) -> None:
        """
        Override: Do not start or check Docker containers at runtime.
        Assume browser and VNC are already running and accessible via env vars.
        """
        logger.info("Skipping Docker container start. Using environment variables for browser/VNC connection.")
        # Do not set self._container or call any Docker methods.
        logger.info(f"Connecting to remote Playwright server at {self.browser_address}")
        self._playwright = await async_playwright().start()
        self._browser = await self._playwright.chromium.connect(self.browser_address)
        self._context = await self._browser.new_context()
    
    async def create_container(self) -> None:
        """
        Skipped: Do not create or check Docker containers at runtime.
        """
        logger.info("Skipping Docker container creation/check. Using environment variables for browser/VNC connection.")
        return None

    def _generate_new_browser_address(self) -> None:
        pass
    def _to_config(self) -> VncDockerPlaywrightBrowserConfig:
        return VncDockerPlaywrightBrowserConfig(
            bind_dir=self._bind_dir,
            image=self._image,
            playwright_port=self._playwright_port,
            novnc_port=self._novnc_port,
            playwright_websocket_path=self._playwright_websocket_path,
            inside_docker=self._inside_docker,
            network_name=self._network_name,
        )

    @classmethod
    def _from_config(
        cls, config: VncDockerPlaywrightBrowserConfig
    ) -> VncDockerPlaywrightBrowser:
        return cls(
            bind_dir=config.bind_dir,
            image=config.image,
            playwright_port=config.playwright_port,
            novnc_port=config.novnc_port,
            playwright_websocket_path=config.playwright_websocket_path,
            inside_docker=config.inside_docker,
            network_name=config.network_name,
        )
