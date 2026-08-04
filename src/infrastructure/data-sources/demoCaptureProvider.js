const { CAPTURE_TYPES, EVIDENCE_LEVELS, normalizeCaptureItem } = require("../../domain/captureItem");

async function fetchCaptureItems() {
  const now = new Date();
  return [
    normalizeCaptureItem({
      id: "demo-market-anomaly-power",
      type: CAPTURE_TYPES.MARKET_ANOMALY,
      title: "电力设备资金与价格同步走强",
      source: "东方财富行情兜底",
      publishedAt: now.toISOString(),
      relatedSectors: ["电力设备"],
      relatedConcepts: ["光伏概念", "储能概念", "电网设备"],
      relatedCompanies: [
        { name: "通威股份", code: "600438" },
        { name: "阳光电源", code: "300274" },
      ],
      summary: "板块净流入与涨跌幅同向，先捕捉为行情异动，再等待公告、财报或新闻交叉验证。",
      impactPath: ["行情异动", "电力设备", "光伏/储能", "公司订单与利润", "预期差验证"],
      evidenceLevel: EVIDENCE_LEVELS.MARKET,
      confidence: 62,
      status: "待研判",
    }),
    normalizeCaptureItem({
      id: "demo-financial-report-chip",
      type: CAPTURE_TYPES.FINANCIAL_REPORT,
      title: "半导体设备公司披露业绩预告",
      source: "AKShare 财务接口待接入",
      publishedAt: now.toISOString(),
      relatedSectors: ["半导体"],
      relatedConcepts: ["半导体设备", "国产替代"],
      relatedCompanies: [
        { name: "北方华创", code: "002371" },
        { name: "中微公司", code: "688012" },
      ],
      summary: "财报类资料需要抽取营收、利润、毛利率、现金流和订单变化，并与市场预期比较。",
      impactPath: ["财报", "半导体设备", "订单/利润", "国产替代", "预期差"],
      evidenceLevel: EVIDENCE_LEVELS.OFFICIAL,
      confidence: 72,
      status: "待清洗",
    }),
    normalizeCaptureItem({
      id: "demo-earnings-call-storage",
      type: CAPTURE_TYPES.EARNINGS_CALL,
      title: "储能公司电话会提到海外渠道改善",
      source: "电话会议纪要待接入",
      publishedAt: now.toISOString(),
      relatedSectors: ["电力设备"],
      relatedConcepts: ["储能概念", "逆变器"],
      relatedCompanies: [
        { name: "阳光电源", code: "300274" },
        { name: "固德威", code: "688390" },
      ],
      summary: "电话会议观点要拆分事实陈述、管理层判断和分析师追问，不能直接当成投资结论。",
      impactPath: ["电话会议", "储能", "海外渠道", "出货/库存", "后续验证"],
      evidenceLevel: EVIDENCE_LEVELS.RESEARCH,
      confidence: 58,
      status: "待验证",
    }),
  ];
}

module.exports = { fetchCaptureItems };
