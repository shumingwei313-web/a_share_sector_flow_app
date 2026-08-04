const { CAPTURE_TYPES, EVIDENCE_LEVELS, normalizeCaptureItem } = require("../../domain/captureItem");

const MCP_AKTOOLS_URL = process.env.MCP_AKTOOLS_HTTP_URL || "";

async function fetchCaptureItems() {
  if (MCP_AKTOOLS_URL) {
    try {
      return mergeById(await fetchFromGateway(), fallbackItems(), 12);
    } catch (_) {
      return fallbackItems();
    }
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
    normalizeCaptureItem({
      id: "mcp-aktools-announcement-order-book",
      type: CAPTURE_TYPES.ANNOUNCEMENT,
      title: "重点公司公告出现订单与产能扩张线索",
      source: "mcp-aktools · AKShare 公告",
      provider: "mcp-aktools",
      market: "A股",
      publishedAt: new Date(now.getTime() - 76 * 60 * 1000).toISOString(),
      relatedSectors: ["通信设备", "电子"],
      relatedConcepts: ["光模块", "PCB", "服务器"],
      relatedCompanies: [
        { name: "中际旭创", code: "300308" },
        { name: "沪电股份", code: "002463" },
        { name: "工业富联", code: "601138" },
      ],
      summary: "公告入口用于捕捉订单、产能、股权激励和重大合同，不直接做投资建议，先进入证据池等待连接模块验证。",
      impactPath: ["公司公告", "订单/产能", "收入弹性", "板块情绪", "研究链记录"],
      evidenceLevel: EVIDENCE_LEVELS.OFFICIAL,
      confidence: 71,
      status: "MCP 待接入",
    }),
    normalizeCaptureItem({
      id: "mcp-aktools-news-policy-power-grid",
      type: CAPTURE_TYPES.NEWS,
      title: "电网与储能方向受到政策和资金共同关注",
      source: "mcp-aktools · AKShare 新闻",
      provider: "mcp-aktools",
      market: "A股",
      publishedAt: new Date(now.getTime() - 103 * 60 * 1000).toISOString(),
      relatedSectors: ["电网设备", "新能源车"],
      relatedConcepts: ["特高压", "储能概念", "智能电网"],
      relatedCompanies: [
        { name: "国电南瑞", code: "600406" },
        { name: "许继电气", code: "000400" },
        { name: "阳光电源", code: "300274" },
      ],
      summary: "新闻和政策类信号需要和板块资金、公司公告、订单变化相互验证，避免只追逐单条消息。",
      impactPath: ["政策/新闻", "电网投资", "设备需求", "相关公司", "复盘验证"],
      evidenceLevel: EVIDENCE_LEVELS.NEWS,
      confidence: 62,
      status: "MCP 待接入",
    }),
    normalizeCaptureItem({
      id: "mcp-aktools-market-anomaly-robotics",
      type: CAPTURE_TYPES.MARKET_ANOMALY,
      title: "机器人概念出现热度扩散",
      source: "mcp-aktools · AKShare 行情异动",
      provider: "mcp-aktools",
      market: "A股",
      publishedAt: new Date(now.getTime() - 127 * 60 * 1000).toISOString(),
      relatedSectors: ["机器人"],
      relatedConcepts: ["机器人减速器", "人形机器人", "工业自动化"],
      relatedCompanies: [
        { name: "中大力德", code: "002896" },
        { name: "绿的谐波", code: "688017" },
        { name: "汇川技术", code: "300124" },
      ],
      summary: "概念扩散适合进入捕捉池，但需要在连接模块里拆分产业链位置，区分龙头、补涨和纯情绪标的。",
      impactPath: ["行情异动", "热门概念", "产业链位置", "龙头/跟随", "风险过滤"],
      evidenceLevel: EVIDENCE_LEVELS.DATA,
      confidence: 64,
      status: "MCP 待接入",
    }),
  ];
}

function mergeById(primary, fallback, limit) {
  const seen = new Set();
  return [...primary, ...fallback].filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  }).slice(0, limit);
}

module.exports = { fetchCaptureItems };
