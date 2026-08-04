const akshareCaptureProvider = require("./akshareCaptureProvider");
const akshareServiceCaptureProvider = require("./akshareServiceCaptureProvider");
const demoCaptureProvider = require("./demoCaptureProvider");

function createCaptureProviders() {
  const mode = process.env.CAPTURE_PROVIDER || "auto";
  const providers = [];

  if ((mode === "akshare-service" || mode === "auto") && process.env.AKSHARE_SERVICE_URL) {
    providers.push({ name: "akshare-service", fetchCaptureItems: akshareServiceCaptureProvider.fetchCaptureItems });
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
