const akshareCaptureProvider = require("./akshareCaptureProvider");
const akshareServiceCaptureProvider = require("./akshareServiceCaptureProvider");
const demoCaptureProvider = require("./demoCaptureProvider");
const financialDatasetsCaptureProvider = require("./financialDatasetsCaptureProvider");
const mcpAktoolsCaptureProvider = require("./mcpAktoolsCaptureProvider");

function createCaptureProviders() {
  const mode = process.env.CAPTURE_PROVIDER || "auto";
  const providers = [];

  if ((mode === "akshare-service" || mode === "auto") && process.env.AKSHARE_SERVICE_URL) {
    providers.push({ name: "akshare-service", fetchCaptureItems: akshareServiceCaptureProvider.fetchCaptureItems });
  }

  if (mode === "mcp-aktools" || mode === "mcp" || mode === "auto") {
    providers.push({ name: "mcp-aktools", fetchCaptureItems: mcpAktoolsCaptureProvider.fetchCaptureItems });
  }

  if (mode === "financial-datasets" || mode === "mcp" || mode === "auto") {
    providers.push({ name: "financial-datasets", fetchCaptureItems: financialDatasetsCaptureProvider.fetchCaptureItems });
  }

  if (mode === "akshare" || (mode === "auto" && !process.env.AKSHARE_SERVICE_URL)) {
    providers.push({ name: "akshare", fetchCaptureItems: akshareCaptureProvider.fetchCaptureItems });
  }

  if (mode === "demo" || mode === "auto") {
    providers.push({ name: "demo", fetchCaptureItems: demoCaptureProvider.fetchCaptureItems });
  }

  return providers;
}

module.exports = { createCaptureProviders };
