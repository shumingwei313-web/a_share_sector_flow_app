const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { loadLocalEnv } = require("./src/infrastructure/env/loadLocalEnv");
const { handleCaptureRequest } = require("./src/interfaces/http/captureController");
const { handleAgentQuery } = require("./src/interfaces/http/agentController");

const ROOT = __dirname;
loadLocalEnv(ROOT);
const PORT = Number(process.env.PORT || 4173);
const EASTMONEY_TOKEN = "bd1d9ddb04089700cf9c27f6f7426281";
const CACHE_MS = 20_000;
const cache = new Map();
const DAILY_CACHE_MS = 12 * 60 * 60 * 1000;
const MARKET_OVERVIEW_ITEMS = [
  { name: "上证指数", code: "000001", subtitle: "000001.SH", secid: "1.000001" },
  { name: "深证成指", code: "399001", subtitle: "399001.SZ", secid: "0.399001" },
  { name: "创业板指", code: "399006", subtitle: "399006.SZ", secid: "0.399006" },
  { name: "科创50", code: "000688", subtitle: "000688.SH", secid: "1.000688" },
  { name: "标普500", code: "SPY", subtitle: "SPY 跟踪代理", secid: "107.SPY" },
  { name: "纳斯达克100", code: "QQQ", subtitle: "QQQ 跟踪代理", secid: "105.QQQ" },
];
const MARKET_OVERVIEW_FALLBACK = [
  { name: "上证指数", code: "000001", subtitle: "000001.SH", value: 3809.66, change: -0.59, turnover: 9522.6 },
  { name: "深证成指", code: "399001", subtitle: "399001.SZ", value: 13448.29, change: -0.96, turnover: 12840.2 },
  { name: "创业板指", code: "399006", subtitle: "399006.SZ", value: 3302.55, change: -1.24, turnover: 4215.8 },
  { name: "科创50", code: "000688", subtitle: "000688.SH", value: 1552.89, change: -5.08, turnover: 812.4 },
  { name: "标普500", code: "SPY", subtitle: "SPY 跟踪代理", value: 747.03, change: 0.72, turnover: 0 },
  { name: "纳斯达克100", code: "QQQ", subtitle: "QQQ 跟踪代理", value: 687.99, change: 0.65, turnover: 0 },
];
const INDEX_SEARCH_FALLBACK = [
  { code: "000001", name: "上证指数", market: "SH", type: "A股指数", industry: "主要市场" },
  { code: "399001", name: "深证成指", market: "SZ", type: "A股指数", industry: "主要市场" },
  { code: "000300", name: "沪深300", market: "SH", type: "A股指数", industry: "宽基指数" },
  { code: "000016", name: "上证50", market: "SH", type: "A股指数", industry: "蓝筹指数" },
  { code: "000688", name: "科创50", market: "SH", type: "A股指数", industry: "科技成长" },
  { code: "000905", name: "中证500", market: "SH", type: "A股指数", industry: "中盘指数" },
  { code: "000852", name: "中证1000", market: "SH", type: "A股指数", industry: "小盘指数" },
];

function cached(key, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < CACHE_MS) return Promise.resolve(hit.value);
  return loader().then((value) => {
    cache.set(key, { time: Date.now(), value });
    return value;
  });
}

function cachedFor(key, ttl, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < ttl) return Promise.resolve(hit.value);
  return loader().then((value) => {
    cache.set(key, { time: Date.now(), value });
    return value;
  });
}

async function eastmoney(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      Referer: "https://quote.eastmoney.com/",
      "User-Agent": "Mozilla/5.0 AShareFlowDashboard/1.0",
    },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`东方财富接口返回 ${response.status}`);
  const payload = await response.json();
  if (payload.rc !== 0 || !payload.data) throw new Error("东方财富接口暂无数据");
  return payload.data;
}

const toYi = (value) => Number(value || 0) / 100_000_000;
const number = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const getStockMarket = (code) => String(code || "").startsWith("6") ? "1" : "0";

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 80_000) {
        req.destroy();
        reject(new Error("请求体过大"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_) {
        reject(new Error("JSON 格式错误"));
      }
    });
    req.on("error", reject);
  });
}

async function getSectorRanking() {
  const params = new URLSearchParams({
    pn: "1", pz: "10", po: "1", np: "1", ut: EASTMONEY_TOKEN,
    fltt: "2", invt: "2", fid: "f62", fs: "m:90+t:2",
    fields: "f12,f14,f2,f3,f6,f8,f10,f62,f66,f72,f78,f84,f104,f105,f124",
  });
  const data = await eastmoney(`https://push2.eastmoney.com/api/qt/clist/get?${params}`);
  return (data.diff || []).map((item, index) => ({
    code: item.f12,
    name: item.f14,
    score: Math.max(30, Math.min(99, Math.round(62 + number(item.f3) * 4 + Math.log10(Math.abs(toYi(item.f62)) + 1) * 12 - index))),
    netInflow: toYi(item.f62),
    turnover: toYi(item.f6),
    volumeRatio: number(item.f10, 1),
    change: number(item.f3),
    signal: item.f62 > 0 && item.f3 > 0 ? "资金价格共振" : item.f62 > 0 ? "资金回流" : "谨慎观察",
    riseCount: number(item.f104),
    fallCount: number(item.f105),
  }));
}

async function getSectorFlow(code) {
  const params = new URLSearchParams({
    lmt: "0", klt: "1", secid: `90.${code}`,
    fields1: "f1,f2,f3,f7", fields2: "f51,f52,f53,f54,f55",
    ut: "b2884a393a59ad64002292a3e90d46a5",
  });
  const data = await eastmoney(`https://push2.eastmoney.com/api/qt/stock/fflow/kline/get?${params}`);
  return (data.klines || []).map((line) => {
    const [time, main] = line.split(",");
    return { time: time.slice(-5), value: toYi(main) };
  });
}

async function getMarketIndexTrend() {
  const params = new URLSearchParams({
    secid: "1.000001",
    fields1: "f1,f2,f3,f4,f5,f6",
    fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
    klt: "1",
    fqt: "1",
    beg: "0",
    end: "20500101",
    lmt: "241",
    ut: "fa5fd1943c7b386f172d6893dbfba10b",
  });
  const data = await eastmoney(`https://push2his.eastmoney.com/api/qt/stock/kline/get?${params}`);
  const preClose = number(data.preKPrice, 0);
  return {
    name: data.name || "上证指数",
    code: data.code || "000001",
    preClose,
    flow: (data.klines || []).map((line) => {
      const [time, , close] = line.split(",");
      const price = number(close);
      const change = preClose ? ((price - preClose) / preClose) * 100 : 0;
      return { time: time.slice(11, 16), value: Number(change.toFixed(3)), price };
    }),
  };
}

async function getMarketOverview() {
  const params = new URLSearchParams({
    fltt: "2",
    invt: "2",
    fields: "f12,f14,f2,f3,f4,f6",
    secids: MARKET_OVERVIEW_ITEMS.map((item) => item.secid).join(","),
  });
  const data = await eastmoney(`https://push2.eastmoney.com/api/qt/ulist.np/get?${params}`);
  const quotes = new Map((data.diff || []).map((item) => [item.f12, item]));
  const overview = MARKET_OVERVIEW_ITEMS.map((item) => {
    const quote = quotes.get(item.code) || {};
    return {
      name: item.name,
      code: item.code,
      subtitle: item.subtitle,
      value: number(quote.f2),
      change: number(quote.f3),
      changeAmount: number(quote.f4),
      turnover: toYi(quote.f6),
      source: "东方财富公开行情",
    };
  }).filter((item) => item.value);
  return overview.length ? overview : MARKET_OVERVIEW_FALLBACK.map((item) => ({ ...item, source: "行情兜底" }));
}

async function getSearchUniverse() {
  const params = new URLSearchParams({
    pn: "1",
    pz: "6000",
    po: "1",
    np: "1",
    ut: EASTMONEY_TOKEN,
    fltt: "2",
    invt: "2",
    fid: "f3",
    fs: "m:1+t:2,m:1+t:23,m:0+t:6,m:0+t:80,m:0+t:81+s:2048",
    fields: "f12,f13,f14,f2,f3,f100",
  });
  const data = await eastmoney(`https://push2.eastmoney.com/api/qt/clist/get?${params}`);
  const stocks = (data.diff || []).map((item) => ({
    code: item.f12,
    name: item.f14,
    market: item.f13 === 1 ? "SH" : "SZ",
    type: "A股",
    price: number(item.f2),
    change: number(item.f3),
    industry: item.f100 || "",
  }));
  return [...INDEX_SEARCH_FALLBACK, ...stocks];
}

async function searchSecurities(keyword) {
  const query = String(keyword || "").trim().toLowerCase();
  if (!query) return { source: "东方财富证券目录", asOf: new Date().toISOString(), items: [] };
  const universe = await cachedFor("search-universe", DAILY_CACHE_MS, getSearchUniverse).catch(() => INDEX_SEARCH_FALLBACK);
  const starts = [];
  const contains = [];
  for (const item of universe) {
    const code = item.code.toLowerCase();
    const name = item.name.toLowerCase();
    if (code.startsWith(query) || name.startsWith(query)) starts.push(item);
    else if (code.includes(query) || name.includes(query) || String(item.industry || "").toLowerCase().includes(query)) contains.push(item);
    if (starts.length + contains.length >= 30) break;
  }
  return {
    source: "东方财富证券目录",
    asOf: new Date().toISOString(),
    items: [...starts, ...contains].slice(0, 8),
  };
}

async function runFinancialAgent(req) {
  const body = await readJson(req);
  return handleAgentQuery({
    body,
    tools: {
      getMarket,
      getHotStocks,
    },
  });
}

async function getStocks(code) {
  const params = new URLSearchParams({
    pn: "1", pz: "12", po: "1", np: "1", ut: EASTMONEY_TOKEN,
    fltt: "2", invt: "2", fid: "f62", fs: `b:${code}`,
    fields: "f12,f14,f2,f3,f6,f8,f10,f62,f66,f72,f100,f102,f103",
  });
  const data = await eastmoney(`https://push2.eastmoney.com/api/qt/clist/get?${params}`);
  return (data.diff || []).map((item) => ({
    code: item.f12,
    name: item.f14,
    price: number(item.f2),
    change: number(item.f3),
    netInflow: toYi(item.f62),
    volumeRatio: number(item.f10, 1),
    industry: item.f100 || "",
    region: item.f102 || "",
    concepts: String(item.f103 || "").split(",").map((value) => value.trim()).filter(Boolean),
    signal: item.f62 > 0 && item.f3 > 0 ? "资金价格共振" : item.f62 > 0 ? "资金流入" : "资金流出",
  }));
}

async function getHotStocks() {
  const rankResponse = await fetch("https://emappdata.eastmoney.com/stockrank/getAllCurrentList", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://vipmoney.eastmoney.com/",
      "User-Agent": "Mozilla/5.0 AShareFlowDashboard/1.0",
    },
    body: JSON.stringify({
      appId: "appId01",
      globalId: "786e4c21-70dc-435a-93bb-38",
      marketType: "000003",
      pageNo: 1,
      pageSize: 12,
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!rankResponse.ok) throw new Error(`东方财富热榜返回 ${rankResponse.status}`);
  const rankPayload = await rankResponse.json();
  const ranking = rankPayload.data || [];
  if (!ranking.length) throw new Error("东方财富热榜暂无数据");

  const secids = ranking.map((item) => {
    const market = item.sc.startsWith("SH") ? "1" : "0";
    return `${market}.${item.sc.slice(2)}`;
  }).join(",");
  const params = new URLSearchParams({
    fltt: "2", invt: "2", fields: "f12,f14,f2,f3,f62,f124", secids,
  });
  const quoteData = await eastmoney(`https://push2.eastmoney.com/api/qt/ulist.np/get?${params}`);
  const quotes = new Map((quoteData.diff || []).map((item) => [item.f12, item]));

  return {
    source: "东方财富热股榜",
    asOf: new Date().toISOString(),
    stocks: ranking.map((rank) => {
      const code = rank.sc.slice(2);
      const quote = quotes.get(code) || {};
      return {
        rank: rank.rk,
        rankChange: number(rank.hisRc),
        code,
        name: quote.f14 || code,
        price: number(quote.f2),
        change: number(quote.f3),
        netInflow: toYi(quote.f62),
      };
    }),
  };
}

async function getStockDetail(code) {
  const cleanCode = String(code || "").replace(/\D/g, "").slice(0, 6);
  if (!cleanCode) throw new Error("股票代码无效");
  const secid = `${getStockMarket(cleanCode)}.${cleanCode}`;
  const quoteParams = new URLSearchParams({
    fltt: "2",
    invt: "2",
    fields: "f43,f44,f45,f46,f48,f57,f58,f60,f116,f162,f168,f170",
    secid,
  });
  const quoteResponse = await fetch(`https://push2.eastmoney.com/api/qt/stock/get?${quoteParams}`, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      Referer: "https://quote.eastmoney.com/",
      "User-Agent": "Mozilla/5.0 AShareFlowDashboard/1.0",
    },
    signal: AbortSignal.timeout(8_000),
  });
  if (!quoteResponse.ok) throw new Error(`东方财富个股行情返回 ${quoteResponse.status}`);
  const quotePayload = await quoteResponse.json();
  const quote = quotePayload.data || {};

  let kline = [];
  try {
    const klineParams = new URLSearchParams({
      secid,
      klt: "101",
      fqt: "1",
      lmt: "60",
      end: "20500101",
      fields1: "f1,f2,f3,f4,f5,f6",
      fields2: "f51,f52,f53,f54,f55,f56,f57",
    });
    const klineData = await eastmoney(`https://push2his.eastmoney.com/api/qt/stock/kline/get?${klineParams}`);
    kline = (klineData.klines || []).map((line) => {
      const [date, open, close, high, low, volume, amount] = line.split(",");
      return { date, open: number(open), close: number(close), high: number(high), low: number(low), volume: number(volume), amount: toYi(amount) };
    });
  } catch (_) {
    kline = [];
  }

  return {
    source: "东方财富个股行情",
    asOf: new Date().toISOString(),
    stock: {
      code: cleanCode,
      name: quote.f58 || cleanCode,
      price: number(quote.f43),
      change: number(quote.f170),
      high: number(quote.f44),
      low: number(quote.f45),
      open: number(quote.f46),
      previousClose: number(quote.f60),
      turnoverAmount: toYi(quote.f48),
      marketCap: toYi(quote.f116),
      pe: number(quote.f162),
      turnoverRate: number(quote.f168),
      kline,
    },
  };
}

async function getMarket() {
  const sectors = await getSectorRanking();
  const [flows, marketIndex, marketOverview] = await Promise.all([
    Promise.allSettled(sectors.slice(0, 8).map((sector) => getSectorFlow(sector.code))),
    getMarketIndexTrend().catch(() => null),
    getMarketOverview().catch(() => MARKET_OVERVIEW_FALLBACK.map((item) => ({ ...item, source: "行情兜底" }))),
  ]);
  sectors.forEach((sector, index) => {
    sector.flow = flows[index]?.status === "fulfilled" ? flows[index].value : [];
  });
  return { source: "东方财富公开行情", asOf: new Date().toISOString(), sectors, marketIndex, marketOverview };
}

function sendJson(res, status, value) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(value));
}

function serveFile(req, res) {
  const pathname = req.url === "/" ? "/index.html" : decodeURIComponent(req.url.split("?")[0]);
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) return sendJson(res, 403, { error: "Forbidden" });
  const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json" };
  fs.readFile(filePath, (error, body) => {
    if (error) return sendJson(res, error.code === "ENOENT" ? 404 : 500, { error: "Not found" });
    res.writeHead(200, {
      "Content-Type": `${types[path.extname(filePath)] || "application/octet-stream"}; charset=utf-8`,
      "Cache-Control": "no-store",
    });
    res.end(body);
  });
}

http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return sendJson(res, 204, {});
    const url = new URL(req.url, `http://${req.headers.host || "127.0.0.1"}`);
    if (url.pathname === "/api/market") return sendJson(res, 200, await cached("market", getMarket));
    if (url.pathname === "/api/search") return sendJson(res, 200, await searchSecurities(url.searchParams.get("q")));
    if (url.pathname === "/api/capture") return sendJson(res, 200, await cached(`capture:${url.searchParams.get("type") || "all"}`, () => handleCaptureRequest(url)));
    if (url.pathname === "/api/hot-stocks") return sendJson(res, 200, await cached("hot-stocks", getHotStocks));
    if (url.pathname === "/api/stock-detail") return sendJson(res, 200, await cached(`stock-detail:${url.searchParams.get("code")}`, () => getStockDetail(url.searchParams.get("code"))));
    if (url.pathname === "/api/agent/query" && req.method === "POST") return sendJson(res, 200, await runFinancialAgent(req));
    const stockMatch = url.pathname.match(/^\/api\/sector\/([A-Z0-9]+)\/stocks$/i);
    if (stockMatch) return sendJson(res, 200, { stocks: await cached(`stocks:${stockMatch[1]}`, () => getStocks(stockMatch[1])) });
    serveFile(req, res);
  } catch (error) {
    sendJson(res, 502, { error: error.message || "上游数据暂不可用" });
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`情绪之道：http://127.0.0.1:${PORT}`);
});
