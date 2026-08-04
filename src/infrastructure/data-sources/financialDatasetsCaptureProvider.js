const { CAPTURE_TYPES, EVIDENCE_LEVELS, normalizeCaptureItem } = require("../../domain/captureItem");

const FINANCIAL_DATASETS_MCP_URL = process.env.FINANCIAL_DATASETS_MCP_HTTP_URL || "";

async function fetchCaptureItems() {
  if (FINANCIAL_DATASETS_MCP_URL) {
    try {
      return mergeById(await fetchFromGateway(), fallbackItems(), 10);
    } catch (_) {
      return fallbackItems();
    }
  }
  return fallbackItems();
}

async function fetchFromGateway() {
  const response = await fetch(`${FINANCIAL_DATASETS_MCP_URL.replace(/\/$/, "")}/capture/us`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(Number(process.env.FINANCIAL_DATASETS_TIMEOUT_MS || 12_000)),
  });
  if (!response.ok) throw new Error(`financial-datasets MCP gateway returned ${response.status}`);
  const payload = await response.json();
  return (payload.items || []).map((item) => normalizeCaptureItem({
    ...item,
    market: item.market || "美股",
    provider: item.provider || "financial-datasets/mcp-server",
  }));
}

function fallbackItems() {
  const now = new Date();
  return [
    normalizeCaptureItem({
      id: "financial-datasets-ai-infra-news",
      type: CAPTURE_TYPES.NEWS,
      title: "AI 基础设施链条延续高景气讨论",
      source: "financial-datasets/mcp-server · news",
      provider: "financial-datasets/mcp-server",
      market: "美股",
      publishedAt: new Date(now.getTime() - 9 * 60 * 1000).toISOString(),
      relatedSectors: ["AI 基础设施", "半导体"],
      relatedConcepts: ["GPU", "数据中心", "光模块"],
      relatedCompanies: [
        { name: "NVIDIA", code: "NVDA" },
        { name: "Broadcom", code: "AVGO" },
        { name: "Taiwan Semiconductor", code: "TSM" },
      ],
      summary: "美股新闻流用于观察海外产业链景气变化，再反向映射到 A 股光模块、PCB、半导体设备等方向。",
      impactPath: ["美股新闻", "AI Capex", "半导体/数据中心", "A股映射", "连接模块验证"],
      evidenceLevel: EVIDENCE_LEVELS.NEWS,
      confidence: 63,
      status: "MCP 待接入",
    }),
    normalizeCaptureItem({
      id: "financial-datasets-earnings-watch",
      type: CAPTURE_TYPES.EARNINGS_CALL,
      title: "云厂商资本开支口径需要跟踪电话会议",
      source: "financial-datasets/mcp-server · earnings",
      provider: "financial-datasets/mcp-server",
      market: "美股",
      publishedAt: new Date(now.getTime() - 31 * 60 * 1000).toISOString(),
      relatedSectors: ["云计算", "AI 基础设施"],
      relatedConcepts: ["资本开支", "服务器", "交换机"],
      relatedCompanies: [
        { name: "Microsoft", code: "MSFT" },
        { name: "Amazon", code: "AMZN" },
        { name: "Alphabet", code: "GOOGL" },
      ],
      summary: "电话会议不是结论来源，重点是抽取管理层对资本开支、库存、交付周期和需求持续性的表述。",
      impactPath: ["电话会议", "资本开支", "服务器/网络设备", "海外供应链", "A股映射"],
      evidenceLevel: EVIDENCE_LEVELS.RESEARCH,
      confidence: 61,
      status: "MCP 待接入",
    }),
    normalizeCaptureItem({
      id: "financial-datasets-financials-margin",
      type: CAPTURE_TYPES.FINANCIAL_REPORT,
      title: "美股半导体利润率变化影响估值锚",
      source: "financial-datasets/mcp-server · financials",
      provider: "financial-datasets/mcp-server",
      market: "美股",
      publishedAt: new Date(now.getTime() - 58 * 60 * 1000).toISOString(),
      relatedSectors: ["半导体"],
      relatedConcepts: ["毛利率", "库存周期", "先进制程"],
      relatedCompanies: [
        { name: "NVIDIA", code: "NVDA" },
        { name: "AMD", code: "AMD" },
        { name: "Micron", code: "MU" },
      ],
      summary: "美股财务数据用于建立估值和景气锚，再与 A 股映射公司的盈利弹性做比较。",
      impactPath: ["美股财报", "利润率/库存", "估值锚", "A股可比公司", "预期差比较"],
      evidenceLevel: EVIDENCE_LEVELS.OFFICIAL,
      confidence: 68,
      status: "MCP 待接入",
    }),
    normalizeCaptureItem({
      id: "financial-datasets-supply-chain-capex",
      type: CAPTURE_TYPES.RESEARCH_VIEW,
      title: "海外 AI Capex 变化需要映射到 A 股供应链",
      source: "financial-datasets/mcp-server · research",
      provider: "financial-datasets/mcp-server",
      market: "美股",
      publishedAt: new Date(now.getTime() - 83 * 60 * 1000).toISOString(),
      relatedSectors: ["AI 基础设施", "通信设备"],
      relatedConcepts: ["交换机", "光模块", "PCB"],
      relatedCompanies: [
        { name: "Arista Networks", code: "ANET" },
        { name: "Broadcom", code: "AVGO" },
        { name: "NVIDIA", code: "NVDA" },
      ],
      summary: "美股供应链线索不直接替代 A 股判断，重点是拆分资本开支、订单能见度和上游器件传导。",
      impactPath: ["海外 Capex", "网络设备", "光模块/PCB", "A股映射", "预期差"],
      evidenceLevel: EVIDENCE_LEVELS.RESEARCH,
      confidence: 65,
      status: "MCP 待接入",
    }),
    normalizeCaptureItem({
      id: "financial-datasets-sec-filing-inventory",
      type: CAPTURE_TYPES.ANNOUNCEMENT,
      title: "SEC 披露中的库存和订单表述值得跟踪",
      source: "financial-datasets/mcp-server · filings",
      provider: "financial-datasets/mcp-server",
      market: "美股",
      publishedAt: new Date(now.getTime() - 119 * 60 * 1000).toISOString(),
      relatedSectors: ["半导体", "存储"],
      relatedConcepts: ["库存周期", "毛利率", "订单能见度"],
      relatedCompanies: [
        { name: "Micron", code: "MU" },
        { name: "AMD", code: "AMD" },
        { name: "Marvell", code: "MRVL" },
      ],
      summary: "公告和定期报告用于抽取库存、收入确认、订单和毛利率变化，再进入比较模块做跨公司验证。",
      impactPath: ["SEC filing", "库存/订单", "利润率", "估值锚", "比较模块"],
      evidenceLevel: EVIDENCE_LEVELS.OFFICIAL,
      confidence: 69,
      status: "MCP 待接入",
    }),
    normalizeCaptureItem({
      id: "financial-datasets-market-anomaly-software",
      type: CAPTURE_TYPES.MARKET_ANOMALY,
      title: "美股软件与 AI 应用方向出现情绪分化",
      source: "financial-datasets/mcp-server · market",
      provider: "financial-datasets/mcp-server",
      market: "美股",
      publishedAt: new Date(now.getTime() - 146 * 60 * 1000).toISOString(),
      relatedSectors: ["软件", "AI 应用"],
      relatedConcepts: ["企业软件", "Agent", "云服务"],
      relatedCompanies: [
        { name: "Palantir", code: "PLTR" },
        { name: "Salesforce", code: "CRM" },
        { name: "ServiceNow", code: "NOW" },
      ],
      summary: "美股 AI 应用行情若与业绩兑现分化，需要在判断模块里区分估值扩张和真实收入增长。",
      impactPath: ["行情异动", "估值变化", "业绩兑现", "A股映射", "风险提示"],
      evidenceLevel: EVIDENCE_LEVELS.DATA,
      confidence: 58,
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
