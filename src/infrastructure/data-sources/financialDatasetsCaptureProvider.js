const { CAPTURE_TYPES, EVIDENCE_LEVELS, normalizeCaptureItem } = require("../../domain/captureItem");

const FINANCIAL_DATASETS_MCP_URL = process.env.FINANCIAL_DATASETS_MCP_HTTP_URL || "";

async function fetchCaptureItems() {
  if (FINANCIAL_DATASETS_MCP_URL) {
    return fetchFromGateway();
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
  ];
}

module.exports = { fetchCaptureItems };
