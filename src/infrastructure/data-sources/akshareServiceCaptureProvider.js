const { normalizeCaptureItem } = require("../../domain/captureItem");

const SERVICE_URL = process.env.AKSHARE_SERVICE_URL || "";

async function fetchCaptureItems() {
  if (!SERVICE_URL) throw new Error("AKSHARE_SERVICE_URL is not configured");
  const response = await fetch(`${SERVICE_URL.replace(/\/$/, "")}/capture?limit=30`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(Number(process.env.AKSHARE_SERVICE_TIMEOUT_MS || 12_000)),
  });
  if (!response.ok) throw new Error(`AKShare service returned ${response.status}`);
  const payload = await response.json();
  return (payload.items || []).map(normalizeCaptureItem);
}

module.exports = { fetchCaptureItems };
