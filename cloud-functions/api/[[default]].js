import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const {
  getMarket,
  getSectorStocks,
  getHotStocks,
  getStockDetail,
  searchSecurities,
} = require("../../api/_marketData.js");
const { handleCaptureRequest } = require("../../src/interfaces/http/captureController.js");

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "s-maxage=60, stale-while-revalidate=600",
};

export default async function onRequest({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const url = new URL(request.url);
    const data = await route(url);
    return json(data, 200);
  } catch (error) {
    return json(
      {
        error: error.message || "数据源暂不可用",
        asOf: new Date().toISOString(),
      },
      502,
    );
  }
}

async function route(url) {
  const { pathname, searchParams } = url;

  if (pathname === "/api/market") return getMarket();
  if (pathname === "/api/hot-stocks") return getHotStocks();
  if (pathname === "/api/stock-detail") return getStockDetail(searchParams.get("code"));
  if (pathname === "/api/search") return searchSecurities(searchParams.get("q"));
  if (pathname === "/api/capture") return handleCaptureRequest(url);

  const sectorMatch = pathname.match(/^\/api\/sector\/([^/]+)\/stocks$/);
  if (sectorMatch) return getSectorStocks(sectorMatch[1]);

  return {
    error: "API route not found",
    path: pathname,
    available: [
      "/api/market",
      "/api/hot-stocks",
      "/api/stock-detail?code=300308",
      "/api/search?q=000001",
      "/api/capture",
      "/api/sector/BK1201/stocks",
    ],
  };
}

function json(value, status) {
  return new Response(JSON.stringify(value), { status, headers });
}
