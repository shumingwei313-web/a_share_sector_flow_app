const STOP_WORDS = new Set([
  "今天", "这个", "什么", "怎么", "是否", "可以", "需要", "板块", "个股", "公司", "研究", "影响", "资金", "市场", "一下",
  "the", "and", "for", "with", "this", "that", "what", "how", "why", "stock", "market",
]);

function tokenize(text) {
  const raw = String(text || "").toLowerCase();
  const latin = raw.match(/[a-z0-9]{2,}/g) || [];
  const chinese = raw.match(/[\u4e00-\u9fa5]{2,}/g) || [];
  return [...latin, ...chinese]
    .flatMap((token) => splitChineseToken(token))
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

function splitChineseToken(token) {
  if (!/[\u4e00-\u9fa5]/.test(token) || token.length <= 4) return [token];
  const parts = [token];
  for (let index = 0; index <= token.length - 2; index += 1) parts.push(token.slice(index, index + 2));
  for (let index = 0; index <= token.length - 3; index += 1) parts.push(token.slice(index, index + 3));
  for (let index = 0; index <= token.length - 4; index += 1) parts.push(token.slice(index, index + 4));
  return parts;
}

function scoreText(text, queryTokens) {
  const haystack = String(text || "").toLowerCase();
  return queryTokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function captureToEvidence(item) {
  return {
    id: item.id,
    type: item.typeLabel || item.type || "信息",
    source: item.source,
    title: item.title,
    summary: item.summary,
    sectors: item.relatedSectors || [],
    concepts: item.relatedConcepts || [],
    companies: item.relatedCompanies || [],
    evidenceLevel: item.evidenceLevel,
    publishedAt: item.publishedAt,
    confidence: item.confidence,
  };
}

function sectorToEvidence(sector) {
  return {
    id: `sector-${sector.code || sector.name}`,
    type: "板块行情",
    source: "market-provider",
    title: `${sector.name} 板块资金情绪`,
    summary: `${sector.name} 主力净流入 ${formatYi(sector.netInflow)}，涨跌幅 ${formatPercent(sector.change)}，量比 ${Number(sector.volumeRatio || 0).toFixed(2)}x，信号：${sector.signal || "待观察"}。`,
    sectors: [sector.name],
    concepts: sector.concepts || [],
    companies: (sector.stocks || []).slice(0, 3).map((stock) => ({ name: stock.name, code: stock.code || "" })),
    evidenceLevel: "L2_DATA",
    confidence: sector.score || 60,
  };
}

function stockToEvidence(stock) {
  return {
    id: `hot-stock-${stock.code || stock.name}`,
    type: "热股榜",
    source: "stock-sdk",
    title: `${stock.name} 热度第 ${stock.rank || "-"}`,
    summary: `${stock.name} 涨跌幅 ${formatPercent(stock.change)}，主力净流入 ${formatYi(stock.netInflow)}。`,
    sectors: [],
    concepts: stock.concepts || [],
    companies: [{ name: stock.name, code: stock.code || "" }],
    evidenceLevel: "L2_DATA",
    confidence: Math.max(40, 90 - Number(stock.rank || 20)),
  };
}

async function retrieveResearchEvidence({ question, context = {}, tools = {}, limit = 8 } = {}) {
  const query = [
    question,
    context?.sector?.name,
    ...(context?.concepts || []),
    ...(context?.hotStocks || []).map((stock) => `${stock.name} ${stock.code}`),
  ].join(" ");
  const queryTokens = [...new Set(tokenize(query))];

  const [captureResult, marketResult, hotResult] = await Promise.allSettled([
    tools.getCaptureFeed ? tools.getCaptureFeed({ limit: 30 }) : Promise.resolve({ items: [] }),
    tools.getMarket ? tools.getMarket() : Promise.resolve({ sectors: [] }),
    tools.getHotStocks ? tools.getHotStocks() : Promise.resolve({ stocks: [] }),
  ]);

  const captureItems = captureResult.status === "fulfilled" ? captureResult.value.items || [] : [];
  const sectors = marketResult.status === "fulfilled" ? marketResult.value.sectors || [] : [];
  const hotStocks = hotResult.status === "fulfilled" ? hotResult.value.stocks || [] : [];

  const evidence = [
    ...captureItems.map(captureToEvidence),
    ...sectors.slice(0, 12).map(sectorToEvidence),
    ...hotStocks.slice(0, 20).map(stockToEvidence),
  ];

  const ranked = evidence
    .map((item) => {
      const text = [
        item.title,
        item.summary,
        item.type,
        item.source,
        ...(item.sectors || []),
        ...(item.concepts || []),
        ...(item.companies || []).map((company) => `${company.name} ${company.code || ""}`),
      ].join(" ");
      const score = scoreText(text, queryTokens) + sourceWeight(item);
      return { ...item, score };
    })
    .sort((a, b) => b.score - a.score || Number(b.confidence || 0) - Number(a.confidence || 0))
    .slice(0, limit);

  return {
    queryTokens,
    retrievedAt: new Date().toISOString(),
    degraded: [captureResult, marketResult, hotResult].some((result) => result.status === "rejected"),
    evidence: ranked,
  };
}

function sourceWeight(item) {
  if (item.evidenceLevel === "L1_OFFICIAL") return 1.5;
  if (item.evidenceLevel === "L2_DATA") return 1;
  if (item.evidenceLevel === "L3_RESEARCH") return 0.7;
  return 0.3;
}

function formatYi(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "待补";
  return `${number >= 0 ? "+" : ""}${number.toFixed(1)} 亿`;
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "待补";
  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

module.exports = { retrieveResearchEvidence, tokenize };
