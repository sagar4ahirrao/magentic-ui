const { chromium } = require("playwright");
// Read ws path from environment variable
const wsPath = process.env.WS_PATH || "default";
const port = process.env.PLAYWRIGHT_PORT || 37367;

(async () => {
  console.log("Starting Playwright server...");
  console.log(`Port: ${port}`);
  console.log(`WebSocket path: ${wsPath}`);
  console.log(`Display: ${process.env.DISPLAY}`);

  try {
    // Start the remote debugging server
    const browserServer = await chromium.launchServer({
      headless: false,
      port: parseInt(port, 10),
      host: "0.0.0.0", // Explicitly bind to all interfaces
      wsPath: wsPath,
      args: [
        "--start-fullscreen",
        "--start-maximized",
        "--window-size=1440,1440",
        "--window-position=0,0",
        "--disable-infobars",
        "--no-default-browser-check",
        "--kiosk",
        "--disable-session-crashed-bubble",
        "--noerrdialogs",
        "--force-device-scale-factor=1.0",
        "--disable-features=DefaultViewportMetaTag",
        "--force-device-width=1440",
        // Additional args to help with Docker networking
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-gpu",
      ],
    });

    console.log(`Playwright server running: ${browserServer.wsEndpoint()}`);
    console.log(`Server should be accessible at: ws://localhost:${port}/${wsPath}`);
    
    // Test if the server is actually responding
    setTimeout(() => {
      console.log("Playwright server has been running for 5 seconds, server should be ready for connections");
    }, 5000);

    // Keep the process running
    process.on("SIGINT", async () => {
      console.log("Shutting down Playwright server...");
      try {
        await browserServer.close();
      } catch (error) {
        console.error("Error closing browser server:", error);
      }
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("Received SIGTERM, shutting down Playwright server...");
      try {
        await browserServer.close();
      } catch (error) {
        console.error("Error closing browser server:", error);
      }
      process.exit(0);
    });

  } catch (error) {
    console.error("Failed to start Playwright server:", error);
    process.exit(1);
  }
})();
