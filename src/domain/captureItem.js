const CAPTURE_TYPES = Object.freeze({
  NEWS: "news",
  ANNOUNCEMENT: "announcement",
  FINANCIAL_REPORT: "financial_report",
  EARNINGS_CALL: "earnings_call",
  RESEARCH_VIEW: "research_view",
  MARKET_ANOMALY: "market_anomaly",
});

const EVIDENCE_LEVELS = Object.freeze({
  OFFICIAL: "L1_OFFICIAL",
  DATA: "L2_DATA",
  RESEARCH: "L3_RESEARCH",
  NEWS: "L4_NEWS",
  MARKET: "L5_MARKET",
});

function normalizeCaptureItem(input) {
  const item = input || {};
  const type = Object.values(CAPTURE_TYPES).includes(item.type) ? item.type : CAPTURE_TYPES.NEWS;
  return {
    id: String(item.id || `${type}-${Date.now()}`),
    type,
    typeLabel: item.typeLabel || getCaptureTypeLabel(type),
    title: String(item.title || "未命名捕捉项"),
    source: String(item.source || "unknown"),
    sourceUrl: item.sourceUrl || "",
    publishedAt: item.publishedAt || new Date().toISOString(),
    relatedSectors: normalizeStringList(item.relatedSectors),
    relatedConcepts: normalizeStringList(item.relatedConcepts),
    relatedCompanies: normalizeCompanyList(item.relatedCompanies),
    market: item.market || "A股",
    provider: item.provider || "",
    assetClass: item.assetClass || "equity",
    summary: String(item.summary || ""),
    impactPath: normalizeStringList(item.impactPath),
    evidenceLevel: item.evidenceLevel || EVIDENCE_LEVELS.NEWS,
    confidence: clampNumber(item.confidence, 0, 100, 50),
    status: item.status || "captured",
    nextAction: String(item.nextAction || "进入连接模块，补充产业链与公司映射。"),
  };
}

function getCaptureTypeLabel(type) {
  const labels = {
    [CAPTURE_TYPES.NEWS]: "新闻",
    [CAPTURE_TYPES.ANNOUNCEMENT]: "公告",
    [CAPTURE_TYPES.FINANCIAL_REPORT]: "财报",
    [CAPTURE_TYPES.EARNINGS_CALL]: "电话会议",
    [CAPTURE_TYPES.RESEARCH_VIEW]: "研报观点",
    [CAPTURE_TYPES.MARKET_ANOMALY]: "行情异动",
  };
  return labels[type] || "信息";
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function normalizeCompanyList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    if (typeof item === "string") return { name: item, code: "" };
    return { name: String(item.name || ""), code: String(item.code || "") };
  }).filter((item) => item.name);
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

module.exports = {
  CAPTURE_TYPES,
  EVIDENCE_LEVELS,
  getCaptureTypeLabel,
  normalizeCaptureItem,
};
