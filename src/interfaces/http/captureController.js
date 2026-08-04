const { getCaptureFeed } = require("../../application/getCaptureFeed");
const { createCaptureProviders } = require("../../infrastructure/data-sources/captureProviderRouter");

async function handleCaptureRequest(url) {
  const type = url.searchParams.get("type") || "all";
  const limit = Number(url.searchParams.get("limit") || 30);
  return getCaptureFeed({
    providers: createCaptureProviders(),
    type,
    limit: Number.isFinite(limit) ? limit : 30,
  });
}

module.exports = { handleCaptureRequest };
