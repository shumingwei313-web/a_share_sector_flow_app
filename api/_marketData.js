const { StockSDK } = require("stock-sdk");

const EASTMONEY_TOKEN = "bd1d9ddb04089700cf9c27f6f7426281";
const cache = new Map();
const sdk = new StockSDK({
  retry: { maxRetries: 1, baseDelay: 350 },
  providerPolicies: {
    eastmoney: { timeout: 8_000, rateLimit: { requestsPerSecond: 3, maxBurst: 3 } },
    tencent: { timeout: 8_000, rateLimit: { requestsPerSecond: 4, maxBurst: 4 } },
  },
});

const MARKET_CODES = [
  { name: "上证指数", code: "000001", subtitle: "000001.SH", symbol: "sh000001" },
  { name: "深证成指", code: "399001", subtitle: "399001.SZ", symbol: "sz399001" },
  { name: "创业板指", code: "399006", subtitle: "399006.SZ", symbol: "sz399006" },
  { name: "科创50", code: "000688", subtitle: "000688.SH", symbol: "sh000688" },
  { name: "标普500", code: "SPY", subtitle: "SPY 跟踪代理", value: 747.03, change: 0.72 },
  { name: "纳斯达克100", code: "QQQ", subtitle: "QQQ 跟踪代理", value: 687.99, change: 0.65 },
];

const DEMO_SECTORS = [
  ["电子", "BK1201", 96, 334.9, 6148, 1.36, 5.24],
  ["通信设备", "BK0448", 91, 222.6, 1911, 1.42, 5.31],
  ["电网设备", "BK0457", 89, 68.4, 1260, 1.18, 3.59],
  ["半导体", "BK1036", 88, 61.4, 1548, 1.04, 2.47],
  ["机器人", "BK0740", 84, 48.6, 1264, 2.41, 3.28],
  ["光伏设备", "BK1031", 77, 33.8, 706, 1.46, 2.93],
  ["证券", "BK0473", 67, 9.3, 642, 1.18, 0.42],
  ["医药商业", "BK1040", 54, -21.6, 428, 1.67, -1.26],
];

const CONCEPT_MAP = {
  电子: ["通信技术", "物联网", "国产芯片", "PCB", "5G概念", "存储芯片", "苹果概念"],
  通信设备: ["光模块", "通信技术", "5G概念", "物联网", "算力概念", "卫星导航"],
  电网设备: ["特高压", "智能电网", "储能概念", "电网设备", "柔性直流"],
  半导体: ["国产芯片", "半导体设备", "先进封装", "存储芯片", "AI芯片", "光刻机"],
  机器人: ["机器人减速器", "人形机器人", "工业自动化", "具身智能", "智能制造"],
  光伏设备: ["光伏概念", "储能概念", "逆变器", "HJT电池", "TOPCon电池"],
  证券: ["券商概念", "财富管理", "互联金融", "金融科技"],
};

const DEMO_HOT_STOCKS = [
  { rank: 1, code: "300308", name: "中际旭创", price: 238.6, change: 10.01, netInflow: 42.8 },
  { rank: 2, code: "002384", name: "东山精密", price: 34.2, change: 10.0, netInflow: 43.3 },
  { rank: 3, code: "601138", name: "工业富联", price: 58.4, change: 7.21, netInflow: 32.6 },
  { rank: 4, code: "300502", name: "新易盛", price: 176.8, change: 12.2, netInflow: 31.4 },
  { rank: 5, code: "002156", name: "通富微电", price: 29.2, change: 8.08, netInflow: 23.3 },
  { rank: 6, code: "600584", name: "长电科技", price: 38.6, change: 6.18, netInflow: 12.4 },
  { rank: 7, code: "002371", name: "北方华创", price: 402.8, change: 4.48, netInflow: 15.6 },
  { rank: 8, code: "300274", name: "阳光电源", price: 88.7, change: 3.59, netInflow: 9.6 },
  { rank: 9, code: "600438", name: "通威股份", price: 21.5, change: 10.02, netInflow: 3.8 },
  { rank: 10, code: "688012", name: "中微公司", price: 168.2, change: 2.4, netInflow: 6.8 },
  { rank: 11, code: "002463", name: "沪电股份", price: 48.5, change: 10.0, netInflow: 10.0 },
  { rank: 12, code: "002916", name: "深南电路", price: 131.6, change: 6.69, netInflow: 8.2 },
];

const DEMO_SEARCH = [
  { code: "000001", name: "上证指数", market: "SH", type: "A股指数", industry: "主要市场" },
  { code: "399001", name: "深证成指", market: "SZ", type: "A股指数", industry: "主要市场" },
  { code: "300308", name: "中际旭创", market: "SZ", type: "A股", industry: "通信设备" },
  { code: "002384", name: "东山精密", market: "SZ", type: "A股", industry: "电子" },
  { code: "601138", name: "工业富联", market: "SH", type: "A股", industry: "电子" },
];

const DEMO_STOCKS_BY_SECTOR = {
  电子: [
    ["002384", "东山精密", 10.0, 43.3, 0.85, "PCB"],
    ["601138", "工业富联", 7.21, 32.6, 1.32, "物联网"],
    ["603893", "瑞芯微", 10.0, 11.5, 0.87, "国产芯片"],
    ["002463", "沪电股份", 10.0, 10.0, 1.02, "PCB"],
    ["300502", "新易盛", 12.2, 31.4, 1.18, "光模块"],
    ["300308", "中际旭创", 10.01, 42.8, 1.24, "光模块"],
  ],
  通信设备: [
    ["300308", "中际旭创", 10.01, 42.8, 1.24, "光模块"],
    ["300502", "新易盛", 12.2, 31.4, 1.18, "光模块"],
    ["601138", "工业富联", 7.21, 32.6, 1.32, "物联网"],
    ["000063", "中兴通讯", 7.51, 31.9, 1.07, "5G概念"],
    ["002916", "深南电路", 6.69, 8.2, 0.92, "PCB"],
    ["600522", "中天科技", 4.66, 7.8, 1.01, "通信技术"],
  ],
  电网设备: [
    ["600406", "国电南瑞", 4.2, 8.8, 1.15, "智能电网"],
    ["000400", "许继电气", 5.1, 6.4, 1.08, "特高压"],
    ["600312", "平高电气", 3.8, 4.9, 0.98, "特高压"],
    ["002028", "思源电气", 2.9, 3.4, 0.88, "电网设备"],
    ["300360", "炬华科技", 4.1, 2.8, 1.02, "智能电网"],
    ["601179", "中国西电", 2.6, 2.1, 0.91, "柔性直流"],
  ],
  半导体: [
    ["002156", "通富微电", 8.08, 23.3, 1.18, "先进封装"],
    ["600584", "长电科技", 6.18, 12.4, 1.05, "先进封装"],
    ["002371", "北方华创", 4.48, 15.6, 0.98, "半导体设备"],
    ["688012", "中微公司", 2.4, 6.8, 0.87, "半导体设备"],
    ["688256", "寒武纪", 5.6, 9.9, 1.22, "AI芯片"],
    ["688041", "海光信息", 3.9, 5.7, 1.01, "国产芯片"],
  ],
  机器人: [
    ["002896", "中大力德", 5.4, 5.8, 1.28, "机器人减速器"],
    ["688017", "绿的谐波", 4.2, 4.6, 1.13, "机器人减速器"],
    ["002472", "双环传动", 3.6, 3.9, 1.04, "机器人减速器"],
    ["300124", "汇川技术", 2.8, 5.2, 0.96, "工业自动化"],
    ["688322", "奥比中光", 6.1, 2.9, 1.35, "具身智能"],
    ["002747", "埃斯顿", 3.3, 2.4, 1.07, "智能制造"],
  ],
};

function sendJson(res, status, value) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=600");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(value));
}

function cached(key, ttl, loader) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.time < ttl) return Promise.resolve(hit.value);
  return loader().then((value) => {
    cache.set(key, { time: Date.now(), value });
    return value;
  });
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toYi(value) {
  return number(value) / 100_000_000;
}

function scoreSector(sector, index) {
  const flow = Math.log10(Math.abs(sector.netInflow) + 1) * 18;
  const change = Math.max(-16, Math.min(24, sector.change * 4));
  return Math.max(30, Math.min(99, Math.round(58 + flow + change - index)));
}

function flowFromValue(value) {
  const shape = [0.04, 0.11, 0.18, 0.31, 0.42, 0.55, 0.62, 0.58, 0.66, 0.73, 0.86, 0.94, 1];
  return shape.map((ratio, index) => ({
    time: ["09:30", "09:45", "10:00", "10:15", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "14:45", "15:00"][index],
    value: Number((value * ratio).toFixed(2)),
  }));
}

function inferConcepts(sectorName, stockName = "", industry = "") {
  const base = CONCEPT_MAP[sectorName] || CONCEPT_MAP[industry] || [sectorName, "资金活跃", "趋势主线"];
  const text = `${stockName}${industry}`;
  const picked = base.filter((concept) => text.includes(concept.replace("概念", "")));
  return [...new Set([...picked, ...base])].slice(0, 3);
}

function mapSector(item, index) {
  const netInflow = item.mainNetInflow != null ? toYi(item.mainNetInflow) : number(item.netInflow, 0);
  const change = number(item.changePercent ?? item.change, 0);
  return {
    code: item.code,
    name: item.name,
    score: scoreSector({ netInflow, change }, index),
    netInflow,
    turnover: item.amount != null ? toYi(item.amount) : number(item.turnover, Math.abs(netInflow) * 18),
    volumeRatio: number(item.volumeRatio, 1 + Math.min(0.8, Math.abs(change) / 10)),
    change,
    signal: netInflow > 0 && change > 0 ? "资金价格共振" : netInflow > 0 ? "资金回流" : "谨慎观察",
    riseCount: number(item.riseCount, 0),
    fallCount: number(item.fallCount, 0),
    flow: flowFromValue(netInflow),
  };
}

function fallbackSectors() {
  return DEMO_SECTORS.map(([name, code, score, netInflow, turnover, volumeRatio, change]) => ({
    name,
    code,
    score,
    netInflow,
    turnover,
    volumeRatio,
    change,
    signal: netInflow > 0 && change > 0 ? "资金价格共振" : "谨慎观察",
    flow: flowFromValue(netInflow),
  }));
}

async function eastmoney(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain,*/*",
      Referer: "https://quote.eastmoney.com/",
      "User-Agent": "Mozilla/5.0 QXZDApi/1.0",
    },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Eastmoney ${response.status}`);
  const payload = await response.json();
  if (payload.rc !== 0 || !payload.data) throw new Error("Eastmoney empty payload");
  return payload.data;
}

async function getSectorRankingFromEastmoney() {
  const params = new URLSearchParams({
    pn: "1",
    pz: "10",
    po: "1",
    np: "1",
    ut: EASTMONEY_TOKEN,
    fltt: "2",
    invt: "2",
    fid: "f62",
    fs: "m:90+t:2",
    fields: "f12,f14,f3,f6,f10,f62,f104,f105",
  });
  const data = await eastmoney(`https://push2.eastmoney.com/api/qt/clist/get?${params}`);
  return (data.diff || []).map((item) => ({
    code: item.f12,
    name: item.f14,
    changePercent: item.f3,
    mainNetInflow: item.f62,
    turnover: item.f6,
    volumeRatio: item.f10,
    riseCount: item.f104,
    fallCount: item.f105,
  }));
}

async function getMarketOverview() {
  const liveCodes = MARKET_CODES.filter((item) => item.symbol);
  const quotes = await sdk.quotes.cnSimple(liveCodes.map((item) => item.symbol));
  const byCode = new Map(quotes.map((item) => [item.code, item]));
  return MARKET_CODES.map((item) => {
    const quote = byCode.get(item.code);
    return {
      name: item.name,
      code: item.code,
      subtitle: item.subtitle,
      value: number(quote?.price ?? item.value),
      change: number(quote?.changePercent ?? item.change),
      turnover: quote?.amount ? quote.amount / 10_000 : 0,
      source: quote?.source || "stock-sdk fallback",
    };
  });
}

async function getMarketIndexTrend() {
  const rows = await sdk.kline.cnMinute("sh000001", { period: "1" }).catch(() => []);
  const first = rows.find((item) => item.close)?.close || rows[0]?.price || 0;
  return {
    name: "上证指数",
    code: "000001",
    flow: rows.slice(-80).map((item) => {
      const price = number(item.close ?? item.price, first);
      const base = first || price;
      return {
        time: String(item.time || "").slice(-5),
        value: base ? Number((((price - base) / base) * 100).toFixed(3)) : 0,
        price,
      };
    }),
  };
}

async function getMarket() {
  return cached("market", 60_000, async () => {
    const [sectorRank, marketOverview, marketIndex] = await Promise.all([
      sdk.fundFlow.sectorRank({ sectorType: "industry" }).catch(() => getSectorRankingFromEastmoney()).catch(() => []),
      getMarketOverview().catch(() => []),
      getMarketIndexTrend().catch(() => null),
    ]);
    const sectors = (sectorRank.length ? sectorRank : fallbackSectors()).slice(0, 10).map(mapSector);
    return {
      source: sectorRank.length ? "stock-sdk + 东方财富公开行情" : "演示数据",
      asOf: new Date().toISOString(),
      sectors,
      marketIndex: marketIndex?.flow?.length ? marketIndex : null,
      marketOverview: marketOverview.length ? marketOverview : undefined,
    };
  });
}

async function getSectorStocks(code) {
  return cached(`stocks:${code}`, 120_000, async () => {
    let sectorName = (DEMO_SECTORS.find((item) => item[1] === code) || [])[0] || "";
    let constituents = [];
    try {
      constituents = await sdk.board.industry.constituents(code);
    } catch (_) {
      constituents = [];
    }
    if (!constituents.length) {
      const params = new URLSearchParams({
        pn: "1",
        pz: "20",
        po: "1",
        np: "1",
        ut: EASTMONEY_TOKEN,
        fltt: "2",
        invt: "2",
        fid: "f62",
        fs: `b:${code}`,
        fields: "f12,f14,f2,f3,f6,f8,f10,f62,f100",
      });
      try {
        const data = await eastmoney(`https://push2.eastmoney.com/api/qt/clist/get?${params}`);
        constituents = data.diff || [];
      } catch (_) {
        constituents = [];
      }
    }
    if (!constituents.length) {
      const fallbackName = sectorName || "电子";
      constituents = (DEMO_STOCKS_BY_SECTOR[fallbackName] || DEMO_STOCKS_BY_SECTOR.电子).map(([stockCode, name, change, netInflow, volumeRatio, industry]) => ({
        code: stockCode,
        name,
        price: 0,
        changePercent: change,
        totalNetInflow: netInflow * 100_000_000,
        volumeRatio,
        industry,
      }));
      sectorName = fallbackName;
    }
    const stocks = constituents.slice(0, 20).map((item, index) => {
      const name = item.name || item.f14 || "";
      const industry = item.industry || item.f100 || sectorName;
      const netInflow = toYi(item.totalNetInflow ?? item.mainNetInflow ?? item.f62 ?? 0);
      return {
        code: item.code || item.f12,
        name,
        price: number(item.price ?? item.f2),
        change: number(item.changePercent ?? item.f3),
        netInflow: netInflow || Number((Math.max(0.6, 8 - index * 0.45)).toFixed(1)),
        volumeRatio: number(item.volumeRatio ?? item.f10, 1 + index / 20),
        industry,
        concepts: inferConcepts(sectorName, name, industry),
        signal: netInflow > 0 ? "资金流入" : "资金跟随",
      };
    });
    return { source: "stock-sdk board constituents", asOf: new Date().toISOString(), stocks };
  });
}

async function getHotStocks() {
  return cached("hot-stocks", 3 * 60 * 60 * 1000, async () => {
    let rows = [];
    try {
      rows = await sdk.marketEvent.ztPool("zt");
    } catch (_) {
      rows = [];
    }
    const stocks = (rows.length ? rows : DEMO_HOT_STOCKS).slice(0, 20).map((item, index) => ({
      rank: item.rank || index + 1,
      code: item.code,
      name: item.name,
      price: number(item.price),
      change: number(item.changePercent ?? item.change),
      netInflow: item.boardAmount ? toYi(item.boardAmount) : number(item.netInflow, 0),
      industry: item.industry || "",
    }));
    return { source: rows.length ? "stock-sdk 涨停/热度池" : "演示热股榜", asOf: new Date().toISOString(), stocks };
  });
}

async function getStockDetail(code) {
  return cached(`stock-detail:${code}`, 120_000, async () => {
    const cleanCode = String(code || "").replace(/\D/g, "").slice(0, 6);
    if (!cleanCode) throw new Error("股票代码无效");
    const [quote] = await sdk.quotes.cn([cleanCode]).catch(() => []);
    const kline = await sdk.kline.cn(cleanCode, { period: "daily", adjust: "qfq" }).catch(() => []);
    return {
      source: "stock-sdk",
      asOf: new Date().toISOString(),
      stock: {
        code: cleanCode,
        name: quote?.name || cleanCode,
        price: number(quote?.price),
        change: number(quote?.changePercent),
        high: number(quote?.high),
        low: number(quote?.low),
        open: number(quote?.open),
        previousClose: number(quote?.prevClose),
        turnoverAmount: quote?.amount ? quote.amount / 10_000 : 0,
        marketCap: number(quote?.totalMarketCap ?? quote?.marketCap),
        pe: quote?.pe ?? quote?.peDynamic ?? null,
        turnoverRate: quote?.turnoverRate ?? null,
        kline: kline.slice(-60).map((item) => ({
          date: item.date || item.time,
          open: number(item.open),
          close: number(item.close),
          high: number(item.high),
          low: number(item.low),
          volume: number(item.volume),
          amount: item.amount ? item.amount / 100_000_000 : 0,
        })),
      },
    };
  });
}

async function searchSecurities(keyword) {
  const query = String(keyword || "").trim().toLowerCase();
  if (!query) return { source: "stock-sdk search", asOf: new Date().toISOString(), items: [] };
  let items = [];
  try {
    items = await sdk.search(query);
  } catch (_) {
    items = [];
  }
  const source = items.length ? items : DEMO_SEARCH;
  return {
    source: items.length ? "stock-sdk search" : "搜索兜底",
    asOf: new Date().toISOString(),
    items: source
      .filter((item) => `${item.code}${item.name}${item.industry || ""}`.toLowerCase().includes(query))
      .slice(0, 8)
      .map((item) => ({
        code: item.code,
        name: item.name,
        market: item.market || (String(item.code).startsWith("6") ? "SH" : "SZ"),
        type: item.type || item.category || "A股",
        industry: item.industry || item.marketType || "",
      })),
  };
}

function handle(method) {
  return async (req, res) => {
    if (req.method === "OPTIONS") return sendJson(res, 204, {});
    try {
      sendJson(res, 200, await method(req));
    } catch (error) {
      sendJson(res, 502, { error: error.message || "数据源暂不可用", asOf: new Date().toISOString() });
    }
  };
}

module.exports = {
  getMarket,
  getSectorStocks,
  getHotStocks,
  getStockDetail,
  searchSecurities,
  handle,
  sendJson,
};
