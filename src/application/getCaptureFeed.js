const { normalizeCaptureItem } = require("../domain/captureItem");

async function getCaptureFeed({ providers, type = "all", limit = 30 } = {}) {
  if (!providers?.length) throw new Error("Capture providers are required");
  const settled = await Promise.allSettled(providers.map((provider) => provider.fetchCaptureItems()));
  const items = settled
    .flatMap((result) => result.status === "fulfilled" ? result.value : [])
    .map(normalizeCaptureItem)
    .filter((item) => type === "all" || item.type === type)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);

  return {
    source: providers.map((provider) => provider.name || "capture-provider").join(", "),
    asOf: new Date().toISOString(),
    degraded: settled.some((result) => result.status === "rejected"),
    items,
  };
}

module.exports = { getCaptureFeed };
