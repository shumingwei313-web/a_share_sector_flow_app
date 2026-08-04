const { CAPTURE_TYPES, EVIDENCE_LEVELS, normalizeCaptureItem } = require("../../domain/captureItem");

const MCP_AKTOOLS_URL = process.env.MCP_AKTOOLS_HTTP_URL || "";

async function fetchCaptureItems() {
  if (MCP_AKTOOLS_URL) {
    return fetchFromGateway();
  }
  return fallbackItems();
}

async function fetchFromGateway() {
  const response = await fetch(`${MCP_AKTOOLS_URL.replace(/\/$/, "")}/capture/a-share`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(Number(process.env.MCP_AKTOOLS_TIMEOUT_MS || 12_000)),
  });
  if (!response.ok) throw new Error(`mcp-aktools gateway returned ${response.status}`);
  const payload = await response.json();
  return (payload.items || []).map((item) => normalizeCaptureItem({
    ...item,
    market: item.market || "A股",
    provider: item.provider || "mcp-aktools",
  }));
}

function fallbackItems() {
  const now = new Date();
  return [
    normalizeCaptureItem({
      id: "mcp-aktools-board-flow-electronics",
      type: CAPTURE_TYPES.MARKET_ANOMALY,
      title: "电子板块资金与热度同步抬升",
      source: "mcp-aktools · AKShare 板块资金",
      provider: "mcp-aktools",
      market: "A股",
      publishedAt: now.toISOString(),
      relatedSectors: ["电子"],
      relatedConcepts: ["PCB", "通信技术", "国产芯片"],
      relatedCompanies: [
        { name: "东山精密", code: "002384" },
        { name: "工业富联", code: "601138" },
        { name: "沪电股份", code: "002463" },
      ],
      summary: "板块资金、热度和涨幅共振，先捕捉为 A 股板块信息流入口，后续用公告、财报和龙虎榜做证据交叉。",
      impactPath: ["mcp-aktools", "板块资金", "热门概念", "相关公司", "连接模块验证"],
      evidenceLevel: EVIDENCE_LEVELS.DATA,
      confidence: 76,
      status: "MCP 待接入",
    }),
    normalizeCaptureItem({
      id: "mcp-aktools-lhb-active-money",
      type: CAPTURE_TYPES.RESEARCH_VIEW,
      title: "龙虎榜活跃资金集中在科技成长方向",
      source: "mcp-aktools · 龙虎榜/热度工具",
      provider: "mcp-aktools",
      market: "A股",
      publishedAt: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
      relatedSectors: ["通信设备", "半导体"],
      relatedConcepts: ["光模块", "先进封装", "AI芯片"],
      relatedCompanies: [
        { name: "中际旭创", code: "300308" },
        { name: "新易盛", code: "300502" },
        { name: "通富微电", code: "002156" },
      ],
      summary: "龙虎榜和热股榜适合作为资金行为证据，但不能单独作为结论，需要与成交额、换手率和公司基本面同看。",
      impactPath: ["龙虎榜", "活跃席位", "主题聚集", "公司热度", "风险过滤"],
      evidenceLevel: EVIDENCE_LEVELS.RESEARCH,
      confidence: 66,
      status: "MCP 待接入",
    }),
    normalizeCaptureItem({
      id: "mcp-aktools-financial-report-yoy",
      type: CAPTURE_TYPES.FINANCIAL_REPORT,
      title: "业绩预告与板块行情出现同向线索",
      source: "mcp-aktools · AKShare 财报/业绩预告",
      provider: "mcp-aktools",
      market: "A股",
      publishedAt: new Date(now.getTime() - 42 * 60 * 1000).toISOString(),
      relatedSectors: ["半导体"],
      relatedConcepts: ["半导体设备", "国产替代"],
      relatedCompanies: [
        { name: "北方华创", code: "002371" },
        { name: "中微公司", code: "688012" },
      ],
      summary: "财报入口需要抽取营收、利润、毛利率、现金流和订单变化，并和市场情绪做预期差比较。",
      impactPath: ["财报/业绩预告", "利润变化", "订单与毛利率", "行业景气", "预期差"],
      evidenceLevel: EVIDENCE_LEVELS.OFFICIAL,
      confidence: 74,
      status: "MCP 待接入",
    }),
  ];
}

module.exports = { fetchCaptureItems };
