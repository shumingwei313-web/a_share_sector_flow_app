const chartColors = ["#d33f49", "#147d64", "#2563eb", "#b97800", "#7c3aed", "#07879b", "#e05d23", "#334155"];
const demoTimes = ["09:30", "09:45", "10:00", "10:15", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "14:45", "15:00"];
const demoRows = [
  ["机器人", "BK0740", 93, 48.6, 1264, 2.41, 3.28, [2.8, 8, 13, 20, 25, 29, 31, 28, 35, 41, 49, 46, 48.6]],
  ["半导体", "BK1036", 88, 36.2, 1548, 1.94, 2.16, [1.2, 5, 11, 16, 18, 24, 28, 26, 31, 38, 42, 39, 36.2]],
  ["通信设备", "BK0448", 82, 28.4, 882, 1.82, 2.42, [0, 3, 9, 12, 17, 20, 23, 18, 25, 30, 35, 32, 28.4]],
  ["证券", "BK0473", 67, 9.3, 642, 1.18, 0.42, [-2, -5, -3, 1, 5, 8, 6, 4, 7, 11, 14, 12, 9.3]],
  ["光伏设备", "BK1031", 61, -12.4, 706, 1.46, -0.82, [-1, -3, -5, -4, -8, -10, -9, -13, -15, -11, -9, -10, -12.4]],
  ["医药商业", "BK1040", 54, -21.6, 428, 1.67, -1.26, [-2, -4, -7, -9, -12, -14, -16, -15, -18, -22, -25, -23, -21.6]],
];

function makeDemoSector([name, code, score, netInflow, turnover, volumeRatio, change, values]) {
  return {
    name, code, score, netInflow, turnover, volumeRatio, change,
    signal: netInflow > 0 && change > 0 ? "资金价格共振" : "谨慎观察",
    flow: demoTimes.map((time, index) => ({ time, value: values[index] })),
    stocks: [
      { name: `${name}龙头`, change: change + 1.2, netInflow: netInflow / 5, volumeRatio: volumeRatio + 0.3, signal: "资金流入" },
      { name: `${name}核心`, change, netInflow: netInflow / 8, volumeRatio, signal: netInflow > 0 ? "趋势延续" : "资金流出" },
      { name: `${name}弹性`, change: change - 0.8, netInflow: netInflow / 12, volumeRatio: Math.max(0.8, volumeRatio - 0.2), signal: "等待确认" },
    ],
  };
}

let sectors = demoRows.map(makeDemoSector);
let selectedSector = sectors[0];
let currentSort = "score";
let activeLines = new Set(sectors.map((sector) => sector.code));
let flowChart = null;
let hotStocks = [];
let currentReportType = "strategy";
let activeConcepts = [];
let activeWorkspaceModule = "overview";
let captureMarketFilter = "all";
let currentLanguage = "zh";
let searchTimer = null;
let lastSearchController = null;
let stockChart = null;
let lastHotStockSlot = "";
const hotStockRefreshHours = [9, 12, 20];
let captureFilter = "all";
let selectedCaptureId = "cap-anomaly-001";
let marketOverview = [
  { name: "上证指数", code: "000001", subtitle: "000001.SH", value: 3809.66, change: -0.59, low: 3797.64, high: 3827.64, open: 3812.61, previousClose: 3832.26, turnover: 9522.6 },
  { name: "深证成指", code: "399001", subtitle: "399001.SZ", value: 13448.29, change: -0.96, low: 13380.12, high: 13551.48, open: 13512.18, previousClose: 13578.44, turnover: 12840.2 },
  { name: "创业板指", code: "399006", subtitle: "399006.SZ", value: 3302.55, change: -1.24, low: 3288.15, high: 3348.63, open: 3331.27, previousClose: 3343.99, turnover: 4215.8 },
  { name: "科创50", code: "000688", subtitle: "000688.SH", value: 1552.89, change: -5.08, low: 1542.3, high: 1598.72, open: 1588.31, previousClose: 1636.0, turnover: 812.4 },
  { name: "标普500", code: "SPY", subtitle: "SPY 跟踪代理", value: 747.03, change: 0.72, low: 742.18, high: 748.22, open: 744.56, previousClose: 741.69, turnover: 0 },
  { name: "纳斯达克100", code: "QQQ", subtitle: "QQQ 跟踪代理", value: 687.99, change: 0.65, low: 683.42, high: 689.15, open: 684.6, previousClose: 683.55, turnover: 0 },
];
let marketIndex = {
  name: "上证指数",
  flow: demoTimes.map((time, index) => ({ time, value: [-0.32, -0.18, 0.04, 0.16, 0.25, 0.31, 0.22, 0.18, 0.28, 0.34, 0.29, 0.21, 0.08][index] })),
};
const demoHotStocks = [
  { rank: 1, code: "600584", name: "长电科技", price: 38.6, change: 6.18, netInflow: 12.4 },
  { rank: 2, code: "002156", name: "通富微电", price: 29.2, change: 8.08, netInflow: 23.3 },
  { rank: 3, code: "600438", name: "通威股份", price: 21.5, change: 10.02, netInflow: 3.8 },
  { rank: 4, code: "002371", name: "北方华创", price: 402.8, change: 4.48, netInflow: 15.6 },
  { rank: 5, code: "300274", name: "阳光电源", price: 88.7, change: 3.59, netInflow: 9.6 },
  { rank: 6, code: "688012", name: "中微公司", price: 168.2, change: 2.4, netInflow: 6.8 },
];
const captureTypes = [
  ["all", "全部"],
  ["market_anomaly", "行情异动"],
  ["news", "新闻"],
  ["announcement", "公告"],
  ["financial_report", "财报"],
  ["earnings_call", "电话会议"],
  ["research_view", "研报观点"],
];
const captureMarkets = [
  ["all", "全部信息流"],
  ["A股", "A股 · mcp-aktools"],
  ["美股", "美股 · financial-datasets"],
];
const captureSourceLanes = [
  {
    market: "A股",
    title: "A股板块信息流",
    provider: "mcp-aktools",
    scope: "板块资金、龙虎榜、热度、新闻、公告、财报、行情异动",
    route: "AKShare / stock-sdk / MCP 网关",
  },
  {
    market: "美股",
    title: "美股板块信息流",
    provider: "financial-datasets/mcp-server",
    scope: "美股新闻、财报、电话会议、公司事件、产业链线索",
    route: "Financial Datasets MCP / 后端网关",
  },
];
let captureItems = [
  {
    id: "cap-anomaly-001",
    type: "market_anomaly",
    typeLabel: "行情异动",
    title: "电力设备资金与价格同步走强",
    source: "stock-sdk 行情兜底",
    time: "09:42",
    priority: "高",
    sector: "电力设备",
    concepts: ["光伏概念", "储能概念", "电网设备"],
    companies: ["通威股份", "顺钠股份", "国晟科技"],
    summary: "板块净流入与涨跌幅同向，资金斜率高于昨日同区间，需要确认是否由订单、政策或产业链价格催化。",
    impactPath: ["行情异动", "电力设备", "光伏/储能", "组件与逆变器公司", "验证公告与订单"],
    status: "待研判",
    nextAction: "进入连接模块，拆分资金驱动与真实事件驱动。",
  },
  {
    id: "cap-news-001",
    type: "news",
    typeLabel: "新闻",
    title: "机器人减速器产业链关注度升温",
    source: "公开资讯聚合",
    time: "10:18",
    priority: "中",
    sector: "机器人",
    concepts: ["机器人减速器", "人形机器人", "工业自动化"],
    companies: ["中大力德", "绿的谐波", "双环传动"],
    summary: "多来源提到机器人核心零部件供需变化，但尚未确认是否有上市公司直接订单或业绩弹性。",
    impactPath: ["新闻", "机器人", "核心零部件", "减速器/丝杠", "比较真实受益公司"],
    status: "待清洗",
    nextAction: "保留原文链接，等待公告、调研纪要和业绩口径交叉验证。",
  },
  {
    id: "cap-ann-001",
    type: "announcement",
    typeLabel: "公告",
    title: "通信设备公司发布重大合同公告",
    source: "交易所公告",
    time: "11:32",
    priority: "高",
    sector: "通信设备",
    concepts: ["5G概念", "国产芯片", "物联网"],
    companies: ["工业富联", "沪电股份", "生益科技"],
    summary: "公告类信息优先级高于普通新闻，需要抽取合同金额、周期、毛利率假设和历史收入占比。",
    impactPath: ["公告", "通信设备", "订单/合同", "收入确认", "预期差测算"],
    status: "已捕捉",
    nextAction: "进入比较模块，估算合同对收入和利润的边际影响。",
  },
  {
    id: "cap-filing-001",
    type: "financial_report",
    typeLabel: "财报",
    title: "半导体设备公司披露中报预告",
    source: "巨潮资讯/交易所",
    time: "12:06",
    priority: "高",
    sector: "半导体",
    concepts: ["半导体设备", "国产替代", "先进封装"],
    companies: ["北方华创", "中微公司", "拓荆科技"],
    summary: "财报/预告应抽取营收、利润、毛利率、现金流和订单指标，并与市场已有预期做比较。",
    impactPath: ["财报", "半导体设备", "订单与利润", "国产替代链", "预期差"],
    status: "待研判",
    nextAction: "建立财务字段表，后续接 AKShare 财务接口补全指标。",
  },
  {
    id: "cap-call-001",
    type: "earnings_call",
    typeLabel: "电话会议",
    title: "储能公司电话会提到海外渠道改善",
    source: "电话会议纪要",
    time: "14:05",
    priority: "中",
    sector: "电力设备",
    concepts: ["储能概念", "逆变器", "海外需求"],
    companies: ["阳光电源", "固德威", "德业股份"],
    summary: "电话会观点需要拆成管理层事实陈述与分析师追问，不应直接等同于确定增长。",
    impactPath: ["电话会议", "储能", "海外渠道", "订单兑现", "跟踪后续数据"],
    status: "待验证",
    nextAction: "加入研究笔记，标记需要后续用出货和库存数据验证。",
  },
  {
    id: "cap-report-001",
    type: "research_view",
    typeLabel: "研报观点",
    title: "券商上调电网设备景气度判断",
    source: "研报观点摘要",
    time: "15:16",
    priority: "中",
    sector: "电力设备",
    concepts: ["电网设备", "特高压", "智能电网"],
    companies: ["国电南瑞", "许继电气", "平高电气"],
    summary: "研报观点要保留核心假设、目标变量和风险提示，避免只吸收结论。",
    impactPath: ["研报", "电网投资", "设备招标", "订单确认", "利润弹性"],
    status: "待比较",
    nextAction: "和行情资金、公告招标数据比较，判断是否已经被市场反映。",
  },
];

const $ = (selector) => document.querySelector(selector);
const API_BASE = location.protocol === "file:" ? "http://127.0.0.1:4173" : "";
const formatMoney = (value) => `${value > 0 ? "+" : ""}${Number(value).toFixed(1)} 亿`;
const formatTurnover = (value) => `${Number(value).toLocaleString("zh-CN", { maximumFractionDigits: 0 })} 亿`;
const formatPercent = (value) => `${value > 0 ? "+" : ""}${Number(value).toFixed(2)}%`;
const formatIndexValue = (value) => Number(value || 0).toLocaleString("zh-CN", {
  useGrouping: false,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const getActiveConceptLabel = (separator = " · ") => activeConcepts.join(separator);
const isConceptActive = (name) => activeConcepts.includes(name);

function updateConceptSelection(name, action = "add") {
  if (action === "remove") {
    activeConcepts = activeConcepts.filter((concept) => concept !== name);
  } else if (!isConceptActive(name)) {
    activeConcepts = [...activeConcepts, name];
  }
  renderStocks();
  renderAiBrief();
  renderReport();
}

function showUtilityModal({ eyebrow, title, body }) {
  $("#utility-eyebrow").textContent = eyebrow;
  $("#utility-title").textContent = title;
  $("#utility-body").innerHTML = body;
  $("#utility-modal").hidden = false;
}

function closeUtilityModal() {
  $("#utility-modal").hidden = true;
}

function closeMarketModal() {
  $("#market-modal").hidden = true;
}

function closeStockModal() {
  $("#stock-modal").hidden = true;
  stockChart?.dispose();
  stockChart = null;
}

function showMarketModal(item) {
  if (!item) return;
  const change = Number(item.change || 0);
  const value = Number(item.value || 0);
  const derivedPreviousClose = change === -100 ? value : value / (1 + change / 100);
  const previousClose = Number(item.previousClose || derivedPreviousClose || 0);
  const open = Number(item.open || (previousClose ? previousClose * (1 + change / 200) : 0));
  const high = Number(item.high || Math.max(value, open, previousClose) * 1.003);
  const low = Number(item.low || Math.min(value, open, previousClose) * 0.997);
  const turnover = Number(item.turnover || 0);
  $("#market-modal-title").textContent = `${item.name} · ${item.subtitle}`;
  $("#market-modal-subtitle").textContent = item.code?.match(/^[A-Z]+$/)
    ? "美股 ETF 代理 · Eastmoney quote"
    : "A股指数 · Eastmoney quote";
  $("#market-detail-value").textContent = formatIndexValue(value);
  $("#market-detail-change").textContent = formatPercent(change);
  $("#market-detail-change").className = change >= 0 ? "up" : "down";
  $("#market-detail-range").textContent = low && high ? `${formatIndexValue(low)} - ${formatIndexValue(high)}` : "--";
  $("#market-detail-open").textContent = open && previousClose ? `${formatIndexValue(open)} / ${formatIndexValue(previousClose)}` : "--";
  $("#market-detail-turnover").textContent = turnover ? formatTurnover(turnover) : "暂未返回";
  $("#market-modal").hidden = false;
}

function hideActionPopover() {
  $("#action-popover").hidden = true;
  $("#action-popover").innerHTML = "";
  document.querySelectorAll(".topbar-actions button").forEach((button) => button.classList.remove("active"));
}

function showActionPopover(anchor, html) {
  const panel = $("#action-popover");
  const isSame = anchor.classList.contains("active") && !panel.hidden;
  hideActionPopover();
  if (isSame) return;
  anchor.classList.add("active");
  panel.innerHTML = html;
  panel.hidden = false;
}

function updateClock() {
  const now = new Date();
  $("#clock").textContent = now.toLocaleTimeString("zh-CN", { hour12: false });
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const isTrading = day > 0 && day < 6 && ((minutes >= 570 && minutes <= 690) || (minutes >= 780 && minutes <= 900));
  $("#trade-status").textContent = isTrading ? "盘中监控" : "非交易时段";
}

function renderSummary() {
  marketOverview.forEach((item, index) => {
    const name = $(`#market-name-${index}`);
    const code = $(`#market-code-${index}`);
    const value = $(`#market-value-${index}`);
    const change = $(`#market-change-${index}`);
    if (!name || !code || !value || !change) return;
    name.textContent = item.name;
    code.textContent = item.subtitle;
    value.textContent = formatIndexValue(item.value);
    change.textContent = formatPercent(item.change || 0);
    change.className = Number(item.change || 0) >= 0 ? "up" : "down";
  });
}

function getMarketContext() {
  const totalNet = sectors.reduce((sum, sector) => sum + sector.netInflow, 0);
  const strong = sectors.filter((sector) => sector.score >= 75 && sector.netInflow > 0).slice(0, 3);
  const risk = sectors.filter((sector) => sector.netInflow < 0).slice(0, 3);
  const topStock = rankSectorStocks(getFilteredStocks(selectedSector.stocks || []))[0];
  return { totalNet, strong, risk, topStock };
}

function renderSectorList() {
  const list = $("#sector-list");
  list.innerHTML = "";
  [...sectors].sort((a, b) => b[currentSort] - a[currentSort]).forEach((sector) => {
    const item = document.createElement("button");
    item.className = `sector-item ${sector.code === selectedSector.code ? "active" : ""}`;
    item.innerHTML = `<div><strong>${sector.name}</strong><div class="sector-meta"><span class="${sector.netInflow >= 0 ? "up" : "down"}">${formatMoney(sector.netInflow)}</span><span>${sector.volumeRatio.toFixed(2)}x</span><span class="${sector.change >= 0 ? "up" : "down"}">${formatPercent(sector.change)}</span></div></div><div class="score-ring" style="--score:${sector.score}"><span>${sector.score}</span></div>`;
    item.addEventListener("click", () => selectSector(sector));
    list.appendChild(item);
  });
}

function renderDetail() {
  $("#sector-name").textContent = selectedSector.name;
  $("#sector-signal").textContent = selectedSector.signal;
  $("#sector-net").textContent = formatMoney(selectedSector.netInflow);
  $("#sector-net").className = selectedSector.netInflow >= 0 ? "up" : "down";
  $("#sector-turnover").textContent = formatTurnover(selectedSector.turnover);
  $("#sector-volume").textContent = `${selectedSector.volumeRatio.toFixed(2)}x`;
  $("#sector-change").textContent = formatPercent(selectedSector.change);
  $("#sector-change").className = selectedSector.change >= 0 ? "up" : "down";
}

function renderStocks() {
  const body = $("#stock-table");
  const stocks = selectedSector.stocks || [];
  const conceptLabel = getActiveConceptLabel();
  renderConcepts(stocks);
  renderStockMessages(stocks);
  const rows = getFilteredStocks(stocks);
  $("#stock-section-title").textContent = activeConcepts.length
    ? `${selectedSector.name} · ${conceptLabel}相关个股`
    : `${selectedSector.name}情绪热股`;
  body.innerHTML = stocks.length ? "" : `<tr><td colspan="5" class="table-loading">正在读取板块个股...</td></tr>`;
  if (stocks.length && !rows.length) body.innerHTML = `<tr><td colspan="5" class="table-loading">叠加概念暂无交集个股，双击已选概念可取消。</td></tr>`;
  rankSectorStocks(rows).forEach((stock) => {
    const row = document.createElement("tr");
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `查看${stock.name}公司信息`);
    const concepts = normalizeStockConcepts(stock);
    const visibleConcepts = activeConcepts.length
      ? [...activeConcepts, ...concepts.filter((concept) => !activeConcepts.includes(concept))].slice(0, 3)
      : concepts.slice(0, 2);
    const stockConcepts = visibleConcepts.join(" · ");
    row.innerHTML = `<td><strong class="stock-name">${stock.name}</strong><small class="stock-concepts">${stockConcepts || stock.industry || selectedSector.name}</small></td><td class="${stock.change >= 0 ? "up" : "down"}">${formatPercent(stock.change)}</td><td class="${stock.netInflow >= 0 ? "up" : "down"}">${formatMoney(stock.netInflow)}</td><td>${stock.volumeRatio.toFixed(2)}x</td><td><span class="signal-pill">${stock.emotionLabel || stock.signal}</span></td>`;
    row.addEventListener("click", () => openStockDetail(stock.code, stock));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openStockDetail(stock.code, stock);
      }
    });
    body.appendChild(row);
  });
}

function getFallbackConcepts() {
  const conceptMap = {
    机器人: ["机器人概念", "减速器", "工业母机", "具身智能", "智能制造"],
    半导体: ["芯片概念", "半导体设备", "先进封装", "存储芯片", "AI芯片"],
    通信设备: ["5G概念", "通信设备", "算力概念", "光模块", "卫星导航"],
    证券: ["券商概念", "互联金融", "财富管理", "金融科技"],
    有色金属: ["小金属概念", "黄金概念", "稀缺资源", "铜", "锂电池"],
    工业金属: ["铜", "铝", "小金属概念", "稀缺资源"],
    黄金: ["黄金概念", "贵金属", "避险资产"],
  };
  return conceptMap[selectedSector.name] || [selectedSector.name, "资金活跃", "趋势主线"];
}

function normalizeStockConcepts(stock) {
  return stock.concepts?.length ? stock.concepts : getFallbackConcepts().slice(0, 2);
}

function getConceptStats(stocks) {
  const stats = new Map();
  const source = stocks.length ? stocks : selectedSector.stocks || [];
  source.forEach((stock) => {
    normalizeStockConcepts(stock).forEach((concept) => {
      const item = stats.get(concept) || { name: concept, count: 0, netInflow: 0, topStocks: [] };
      item.count += 1;
      item.netInflow += stock.netInflow || 0;
      item.topStocks.push(stock);
      stats.set(concept, item);
    });
  });
  if (!stats.size) {
    getFallbackConcepts().forEach((concept) => stats.set(concept, { name: concept, count: 0, netInflow: selectedSector.netInflow / 3, topStocks: [] }));
  }
  return [...stats.values()]
    .map((item) => ({ ...item, topStocks: rankSectorStocks(item.topStocks).slice(0, 3) }))
    .sort((a, b) => b.count - a.count || b.netInflow - a.netInflow);
}

function getFilteredStocks(stocks) {
  if (!activeConcepts.length) return stocks;
  return stocks.filter((stock) => {
    const concepts = normalizeStockConcepts(stock);
    return activeConcepts.every((concept) => concepts.includes(concept));
  });
}

function getHotRank(stock) {
  const hot = hotStocks.find((item) => item.code === stock.code || item.name === stock.name);
  return hot?.rank || null;
}

function scoreSectorStock(stock, index) {
  const hotRank = getHotRank(stock);
  const hotScore = hotRank ? Math.max(0, 36 - hotRank * 2) : 0;
  const leaderScore = index === 0 ? 18 : Math.max(0, 10 - index);
  const fundScore = Math.max(-12, Math.min(24, stock.netInflow * 1.8));
  const changeScore = Math.max(-8, Math.min(18, stock.change * 2));
  const volumeScore = Math.max(0, Math.min(12, stock.volumeRatio * 4));
  return hotScore + leaderScore + fundScore + changeScore + volumeScore;
}

function rankSectorStocks(stocks) {
  return [...stocks]
    .map((stock, index) => {
      const hotRank = getHotRank(stock);
      const emotionScore = scoreSectorStock(stock, index);
      const isLeader = index === 0 || stock.netInflow === Math.max(...stocks.map((item) => item.netInflow));
      const emotionLabel = hotRank
        ? `人气第${hotRank}`
        : isLeader && stock.netInflow > 0
          ? "板块龙头"
          : stock.netInflow > 0
            ? "资金跟随"
            : stock.signal;
      return { ...stock, hotRank, emotionScore, emotionLabel };
    })
    .sort((a, b) => b.emotionScore - a.emotionScore);
}

function renderStockMessages(stocks) {
  const container = $("#stock-message-list");
  const concepts = getConceptStats(stocks).slice(0, 3);
  container.innerHTML = "";
  concepts.forEach((concept) => {
    const names = concept.topStocks.map((stock) => stock.name).join("、") || `${selectedSector.name}相关个股`;
    const card = document.createElement("button");
    card.className = `stock-message-card concept-card ${isConceptActive(concept.name) ? "active" : ""}`;
    card.innerHTML = `
      <span>${activeConcepts.length > 1 && isConceptActive(concept.name) ? "叠加概念" : "热门概念"}</span>
      <strong>${concept.name}</strong>
      <p>${concept.count ? `${concept.count}只相关个股，概念内主力净流入${formatMoney(concept.netInflow)}。` : "等待实时个股数据，先按板块标签展示。"}</p>
      <small>相关：${names}</small>
    `;
    card.onclick = (event) => {
      if (event.detail > 1) return;
      updateConceptSelection(concept.name);
    };
    card.ondblclick = () => updateConceptSelection(concept.name, "remove");
    container.appendChild(card);
  });
}

function renderConcepts(stocks) {
  const container = $("#sector-concepts");
  const concepts = getConceptStats(stocks).slice(0, 8);
  container.innerHTML = "";
  concepts.forEach((concept, index) => {
    const button = document.createElement("button");
    const isActive = isConceptActive(concept.name);
    button.className = `concept-tag ${index < 3 ? "hot" : ""} ${isActive ? "active" : ""} ${activeConcepts.length > 1 && isActive ? "stacked" : ""}`;
    button.innerHTML = `${concept.name}<small>${concept.count || "-"}股</small>${activeConcepts.length > 1 && isActive ? "<em>叠加</em>" : ""}`;
    button.title = isActive ? "双击取消该概念" : "单击加入概念叠加筛选";
    button.onclick = (event) => {
      if (event.detail > 1) return;
      updateConceptSelection(concept.name);
    };
    button.ondblclick = () => updateConceptSelection(concept.name, "remove");
    container.appendChild(button);
  });
}

async function selectSector(sector) {
  if (!sector) return;
  selectedSector = sector;
  activeConcepts = [];
  renderSectorList();
  renderDetail();
  renderStocks();
  renderAiBrief();
  renderReport();
  renderInsights();
  animateChart();
  await loadStocks(sector);
}

async function loadStocks(sector) {
  try {
    const response = await fetch(`${API_BASE}/api/sector/${sector.code}/stocks`);
    if (!response.ok) throw new Error("个股数据不可用");
    const data = await response.json();
    sector.stocks = data.stocks;
    if (selectedSector.code === sector.code) {
      renderStocks();
      renderAiBrief();
      renderReport();
    }
  } catch (_) {
    if (!sector.stocks) sector.stocks = [];
  }
}

function renderInsights() {
  const strong = sectors.filter((sector) => sector.score >= 75 && sector.netInflow > 0).slice(0, 3);
  const risk = sectors.filter((sector) => sector.netInflow < 0).slice(0, 3);
  const items = [
    ["优先观察资金与价格共振", `${strong.map((sector) => sector.name).join("、") || "暂无"}位于资金流入前列，可关注持续性而非单点脉冲。`],
    ["留意曲线斜率变化", `${selectedSector.name}当前净流入${formatMoney(selectedSector.netInflow)}，午后斜率转弱时应降低信号权重。`],
    ["资金流出板块", `${risk.map((sector) => sector.name).join("、") || "暂无明显板块"}净流出居前，等待价格与资金同时企稳。`],
  ];
  $("#insight-list").innerHTML = items.map(([title, body]) => `<article class="insight"><strong>${title}</strong><p>${body}</p></article>`).join("");
  $("#risk-text").textContent = "资金流向是统计口径，不等于机构真实持仓，也不构成投资建议。请结合行情延迟、交易成本、仓位和止损规则判断。";
}

function renderChartDigest() {
  const digest = $("#chart-digest");
  if (!digest) return;
  const flow = selectedSector.flow || [];
  const first = flow[0]?.value ?? selectedSector.netInflow;
  const last = flow.at(-1)?.value ?? selectedSector.netInflow;
  const slope = last - first;
  const visibleCount = sectors.slice(0, 8).filter((sector) => activeLines.has(sector.code)).length;
  const leadStock = rankSectorStocks(selectedSector.stocks || [])[0];
  const slopeText = slope >= 0 ? "净流入斜率向上" : "净流入斜率转弱";
  digest.innerHTML = `
    <article>
      <span>当前曲线</span>
      <strong>${selectedSector.name}</strong>
      <p>${slopeText}，尾盘累计 ${formatMoney(last)}。</p>
    </article>
    <article>
      <span>对照组</span>
      <strong>${visibleCount} 条资金线</strong>
      <p>与上证指数同屏比较，观察资金领先还是价格领先。</p>
    </article>
    <article>
      <span>联动个股</span>
      <strong>${leadStock?.name || "等待个股"}</strong>
      <p>${leadStock ? `综合排序靠前，主力净流入 ${formatMoney(leadStock.netInflow)}。` : "等待板块个股数据加载。"}</p>
    </article>
  `;
}

function renderAiBrief() {
  const container = $("#ai-brief-list");
  if (!container) return;
  const { totalNet, strong, risk, topStock } = getMarketContext();
  const trendTone = totalNet > 80 ? "风险偏好明显回升" : totalNet > 0 ? "结构性风险偏好修复" : "资金情绪偏谨慎";
  const indexLast = marketIndex?.flow?.at(-1)?.value ?? 0;
  const sectorTone = selectedSector.netInflow > 0 && selectedSector.change > 0
    ? "资金与价格形成同向验证"
    : selectedSector.netInflow > 0
      ? "资金先行回流，价格仍需确认"
      : "资金动能偏弱，暂以风控观察为主";
  const leaderText = topStock
    ? `${topStock.name}在板块内综合得分靠前，主力净流入${formatMoney(topStock.netInflow)}，可作为情绪锚点跟踪。`
    : "板块个股仍在加载，先用板块级资金斜率作为情绪锚点。";
  const cards = [
    ["市场结论", trendTone, `全市场主力净流入约${formatMoney(totalNet)}，${marketIndex?.name || "大盘"}涨跌幅${formatPercent(indexLast)}，${strong.map((sector) => sector.name).join("、") || "暂无明显强势板块"}贡献主要情绪。`],
    ["板块判断", getActiveConceptLabel() || selectedSector.name, `${activeConcepts.length ? `${selectedSector.name}中的${getActiveConceptLabel(" + ")}` : selectedSector.name}${sectorTone}，当前量比${selectedSector.volumeRatio.toFixed(2)}x，适合用曲线斜率跟踪持续性。`],
    ["个股线索", topStock?.name || "等待数据", leaderText],
    ["风控提示", risk.length ? risk.map((sector) => sector.name).join("、") : "暂无明显风险板块", risk.length ? "净流出板块需要等待资金与价格同时企稳后再提高权重。" : "当前风险集中度不高，但仍需关注午后资金斜率变化。"],
  ];
  container.innerHTML = cards.map(([label, title, text]) => `
    <article class="ai-brief-card">
      <span>${label}</span>
      <strong>${title}</strong>
      <p>${text}</p>
    </article>
  `).join("");
}

function getReportTemplates() {
  const { totalNet, strong, risk, topStock } = getMarketContext();
  const leaders = strong.map((sector) => sector.name).join("、") || selectedSector.name;
  const stockLine = topStock ? `${topStock.name}（${formatPercent(topStock.change)}，主力净流入${formatMoney(topStock.netInflow)}）` : "板块龙头股仍在读取中";
  return {
    strategy: {
      title: `${selectedSector.name}${activeConcepts.length ? `·${getActiveConceptLabel()}` : ""}资金情绪策略日报`,
      points: [
        `核心结论：市场主力净流入${formatMoney(totalNet)}，${marketIndex?.name || "大盘"}涨跌幅${formatPercent(marketIndex?.flow?.at(-1)?.value || 0)}，${leaders}处于资金情绪主线。`,
        `数据依据：${selectedSector.name}净流入${formatMoney(selectedSector.netInflow)}，涨跌幅${formatPercent(selectedSector.change)}，量比${selectedSector.volumeRatio.toFixed(2)}x。`,
        `交易线索：优先跟踪${stockLine}及同概念高量比个股的持续性。`,
        "后续监控：若曲线斜率转负或热股榜人气下降，降低追高权重。"
      ],
    },
    chain: {
      title: `${selectedSector.name}${activeConcepts.length ? `·${getActiveConceptLabel()}` : ""}产业链观察`,
      points: [
        `产业链状态：${selectedSector.name}资金热度处于${selectedSector.score}分，反映市场对相关产业链节点的关注度变化。`,
        "受益路径：优先识别板块龙头、上游供给、中游制造和下游应用之间的传导关系。",
        "验证问题：后续需要用 AKShare 财务摘要、业绩事件和公告数据确认是否存在真实基本面变化。",
        "研究记录：把资金情绪作为研究入口，保留当时关注理由、证据来源和待复盘假设。"
      ],
    },
    risk: {
      title: `${selectedSector.name}${activeConcepts.length ? `·${getActiveConceptLabel()}` : ""}资金异动风控预警`,
      points: [
        `预警对象：${selectedSector.name}及相关概念热股，当前信号为“${selectedSector.signal}”。`,
        `触发条件：资金净流入${formatMoney(selectedSector.netInflow)}，若高位放量但人气回落，需提示回撤风险。`,
        "交叉验证：结合资讯事件、公告、龙虎榜和财务指标，判断是否存在短期情绪过热。",
        `风险板块：${risk.map((sector) => sector.name).join("、") || "暂无明显净流出主线"}。`
      ],
    },
  };
}

function renderReport() {
  const output = $("#report-output");
  if (!output) return;
  const template = getReportTemplates()[currentReportType];
  output.innerHTML = `
    <strong>${template.title}</strong>
    <ul>${template.points.map((point) => `<li>${point}</li>`).join("")}</ul>
  `;
}

function renderReportTabs() {
  document.querySelectorAll(".report-tabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.report === currentReportType);
    button.onclick = () => {
      currentReportType = button.dataset.report;
      renderReportTabs();
      renderReport();
    };
  });
}

function renderLegend() {
  const legend = $("#chart-legend");
  legend.innerHTML = "";
  const indexBadge = document.createElement("button");
  indexBadge.className = "active index-line";
  indexBadge.innerHTML = `<i style="--line-color:#111a17"></i>${marketIndex?.name || "上证指数"}`;
  legend.appendChild(indexBadge);
  sectors.slice(0, 8).forEach((sector, index) => {
    const button = document.createElement("button");
    button.className = activeLines.has(sector.code) ? "active" : "";
    button.innerHTML = `<i style="--line-color:${chartColors[index]}"></i>${sector.name}`;
    button.onclick = () => {
      if (activeLines.has(sector.code) && activeLines.size > 1) activeLines.delete(sector.code);
      else activeLines.add(sector.code);
      renderLegend();
      animateChart();
    };
    legend.appendChild(button);
  });
}

function animateChart() {
  const container = $("#flow-chart-canvas");
  if (!window.echarts) {
    container.innerHTML = '<p class="hot-loading">图表插件加载失败，请刷新页面。</p>';
    return;
  }
  if (!flowChart) {
    flowChart = window.echarts.init(container, null, { renderer: "canvas" });
    flowChart.on("click", (params) => {
      if (params.componentType !== "series") return;
      selectSector(sectors.find((sector) => sector.name === params.seriesName));
    });
    flowChart.getZr().on("click", (event) => {
      if (event.target) return;
      selectNearestChartLine(event.offsetX, event.offsetY);
    });
  }
  const visible = sectors.slice(0, 8).filter((sector) => activeLines.has(sector.code) && sector.flow?.length);
  const times = [...visible, marketIndex].filter(Boolean).reduce((longest, item) => item.flow?.length > longest.length ? item.flow.map((point) => point.time) : longest, []);
  const indexPoints = new Map((marketIndex?.flow || []).map((point) => [point.time, point.value]));
  flowChart.setOption({
    animationDuration: 650,
    color: chartColors,
    grid: { top: 14, right: 50, bottom: 34, left: 58, containLabel: false },
    tooltip: {
      trigger: "axis",
      confine: true,
      backgroundColor: "rgba(255,255,255,.97)",
      borderColor: "#cbd6d1",
      textStyle: { color: "#17211d", fontSize: 12 },
      formatter: (items) => {
        const rows = [...items].sort((a, b) => b.value - a.value);
        return `<strong>${rows[0]?.axisValue || ""}</strong><br>${rows.map((item) => {
          const value = item.seriesName === (marketIndex?.name || "上证指数") ? formatPercent(item.value) : formatMoney(item.value);
          return `${item.marker}${item.seriesName}<span style="float:right;margin-left:18px;font-weight:700">${value}</span>`;
        }).join("<br>")}`;
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: times,
      axisLine: { lineStyle: { color: "#cbd6d1" } },
      axisTick: { show: false },
      axisLabel: { color: "#708079", fontSize: 11, interval: Math.max(1, Math.floor(times.length / 5)) },
    },
    yAxis: [
      {
        type: "value",
        name: "亿元",
        scale: true,
        axisLabel: { color: "#708079", fontSize: 11, formatter: "{value}" },
        splitLine: { lineStyle: { color: "#e5ebe8" } },
      },
      {
        type: "value",
        name: "%",
        scale: true,
        axisLabel: { color: "#708079", fontSize: 11, formatter: "{value}%" },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: marketIndex?.name || "上证指数",
        type: "line",
        yAxisIndex: 1,
        showSymbol: false,
        smooth: 0.16,
        connectNulls: true,
        lineStyle: { width: 2, type: "dashed", color: "#111a17" },
        areaStyle: { color: "rgba(17, 26, 23, 0.04)" },
        emphasis: { focus: "series" },
        data: times.map((time) => indexPoints.get(time) ?? null),
      },
      ...visible.map((sector) => ({
      name: sector.name,
      type: "line",
      yAxisIndex: 0,
      showSymbol: false,
      smooth: 0.18,
      connectNulls: true,
      lineStyle: { width: sector.code === selectedSector.code ? 3 : 2 },
      z: sector.code === selectedSector.code ? 5 : 2,
      emphasis: { focus: "series" },
      data: times.map((time) => {
        const point = sector.flow.find((item) => item.time === time);
        return point ? point.value : null;
      }),
    })),
    ],
  }, true);
}

function selectNearestChartLine(x, y) {
  if (!flowChart?.containPixel({ gridIndex: 0 }, [x, y])) return;
  const [rawIndex, rawValue] = flowChart.convertFromPixel({ gridIndex: 0 }, [x, y]);
  const visible = sectors.slice(0, 8).filter((sector) => activeLines.has(sector.code) && sector.flow?.length);
  const index = Math.max(0, Math.round(rawIndex));
  const nearest = visible
    .map((sector) => ({ sector, distance: Math.abs((sector.flow[index]?.value ?? sector.netInflow) - rawValue) }))
    .sort((a, b) => a.distance - b.distance)[0]?.sector;
  if (nearest) selectSector(nearest);
}

function renderHotStocks(stocks) {
  const list = $("#hot-stock-list");
  list.innerHTML = stocks.map((stock) => `
    <article class="hot-stock-item" role="button" tabindex="0" data-stock-code="${stock.code}" aria-label="查看${stock.name}公司信息">
      <span class="hot-rank-number">${stock.rank}</span>
      <div class="hot-stock-name">
        <strong>${stock.name}</strong>
        <small>${stock.code} · 热度第 ${stock.rank}</small>
      </div>
      <div class="hot-stock-values">
        <strong class="${stock.change >= 0 ? "up" : "down"}">${formatPercent(stock.change)}</strong>
        <small class="${stock.netInflow >= 0 ? "up" : "down"}">资金 ${formatMoney(stock.netInflow)}</small>
      </div>
    </article>
  `).join("");
  list.querySelectorAll(".hot-stock-item").forEach((item) => {
    const open = () => openStockDetail(item.dataset.stockCode);
    item.addEventListener("click", open);
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

function renderStockKline(stock) {
  const target = $("#stock-kline-chart");
  if (!window.echarts) {
    target.innerHTML = '<p class="hot-loading">图表插件加载失败。</p>';
    return;
  }
  stockChart?.dispose();
  stockChart = window.echarts.init(target, null, { renderer: "canvas" });
  const rows = stock.kline?.length ? stock.kline : [];
  if (!rows.length) {
    target.innerHTML = '<p class="hot-loading">日 K 暂未返回，后续由 AKShare 补齐。</p>';
    return;
  }
  stockChart.setOption({
    animationDuration: 450,
    grid: { top: 18, right: 18, bottom: 24, left: 52 },
    tooltip: { trigger: "axis", confine: true },
    xAxis: { type: "category", data: rows.map((row) => row.date.slice(5)), axisLabel: { color: "#8d9a97", fontSize: 11 }, axisTick: { show: false } },
    yAxis: { scale: true, axisLabel: { color: "#8d9a97", fontSize: 11 }, splitLine: { lineStyle: { color: "rgba(70,84,86,.46)" } } },
    series: [{
      type: "candlestick",
      data: rows.map((row) => [row.open, row.close, row.low, row.high]),
      itemStyle: { color: "#ff6b6b", color0: "#2dd4bf", borderColor: "#ff6b6b", borderColor0: "#2dd4bf" },
    }],
  });
}

async function openStockDetail(code, fallbackOverride = {}) {
  const fallback = { ...(hotStocks.find((stock) => stock.code === code) || {}), ...fallbackOverride };
  if (!code) {
    $("#stock-modal-title").textContent = `${fallback.name || "公司详情"} · 待补代码`;
    $("#stock-modal-subtitle").textContent = "当前板块个股缺少证券代码，后续由 AKShare 补齐映射";
    $("#stock-detail-price").textContent = fallback.price ? Number(fallback.price).toFixed(2) : "--";
    $("#stock-detail-change").textContent = fallback.change ? formatPercent(fallback.change) : "--";
    $("#stock-detail-change").className = Number(fallback.change || 0) >= 0 ? "up" : "down";
    $("#stock-detail-marketcap").textContent = "--";
    $("#stock-detail-valuation").textContent = "--";
    $("#stock-detail-turnover").textContent = fallback.netInflow ? `资金 ${formatMoney(fallback.netInflow)}` : "--";
    $("#stock-detail-range").textContent = "代码映射待补齐";
    $("#stock-kline-chart").innerHTML = '<p class="hot-loading">缺少证券代码，暂无法读取日 K。</p>';
    $("#stock-modal").hidden = false;
    return;
  }
  $("#stock-modal-title").textContent = `${fallback.name || "读取公司"} · ${code}`;
  $("#stock-modal-subtitle").textContent = "正在读取 stock-sdk 公司行情";
  $("#stock-detail-price").textContent = fallback.price ? fallback.price.toFixed(2) : "--";
  $("#stock-detail-change").textContent = fallback.change ? formatPercent(fallback.change) : "--";
  $("#stock-detail-change").className = Number(fallback.change || 0) >= 0 ? "up" : "down";
  $("#stock-detail-marketcap").textContent = "--";
  $("#stock-detail-valuation").textContent = "--";
  $("#stock-detail-turnover").textContent = fallback.netInflow ? `资金 ${formatMoney(fallback.netInflow)}` : "--";
  $("#stock-detail-range").textContent = "读取中";
  $("#stock-kline-chart").innerHTML = '<p class="hot-loading">正在读取日 K...</p>';
  $("#stock-modal").hidden = false;
  try {
    const response = await fetch(`${API_BASE}/api/stock-detail?code=${encodeURIComponent(code)}`);
    if (!response.ok) throw new Error("个股详情不可用");
    const data = await response.json();
    const stock = data.stock || fallback;
    $("#stock-modal-title").textContent = `${stock.name || fallback.name || code} · ${stock.code || code}`;
    $("#stock-modal-subtitle").textContent = `A股公司 · ${data.source || "stock-sdk 数据工具"} · ${new Date(data.asOf || Date.now()).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
    $("#stock-detail-price").textContent = Number(stock.price || fallback.price || 0).toFixed(2);
    $("#stock-detail-change").textContent = formatPercent(stock.change || fallback.change || 0);
    $("#stock-detail-change").className = Number(stock.change || fallback.change || 0) >= 0 ? "up" : "down";
    $("#stock-detail-marketcap").textContent = stock.marketCap ? formatTurnover(stock.marketCap) : "暂未返回";
    $("#stock-detail-valuation").textContent = `${stock.pe ? stock.pe.toFixed(2) : "--"} / ${stock.turnoverRate ? formatPercent(stock.turnoverRate) : "--"}`;
    $("#stock-detail-turnover").textContent = stock.turnoverAmount ? formatTurnover(stock.turnoverAmount) : "暂未返回";
    $("#stock-detail-range").textContent = stock.high && stock.low ? `日内 ${stock.low.toFixed(2)} - ${stock.high.toFixed(2)}` : "日内区间待补齐";
    renderStockKline(stock);
  } catch (_) {
    $("#stock-modal-subtitle").textContent = "个股详情接口暂不可用，已保留热榜快照";
    $("#stock-detail-range").textContent = "等待 AKShare 补齐";
    $("#stock-kline-chart").innerHTML = '<p class="hot-loading">日 K 暂未返回。</p>';
  }
}

async function loadHotStocks() {
  try {
    const response = await fetch(`${API_BASE}/api/hot-stocks`);
    if (!response.ok) throw new Error("热榜不可用");
    const data = await response.json();
    hotStocks = data.stocks || [];
    lastHotStockSlot = getHotStockSlot(new Date(data.asOf || Date.now()));
    renderHotStocks(hotStocks);
    renderStocks();
    renderAiBrief();
    renderReport();
    $("#hot-update-time").textContent = `更新 ${new Date(data.asOf).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} · 9/12/20`;
  } catch (_) {
    hotStocks = demoHotStocks;
    renderHotStocks(hotStocks);
    renderStocks();
    renderAiBrief();
    renderReport();
    $("#hot-update-time").textContent = "演示数据 · 9/12/20";
  }
}

function getHotStockSlot(date = new Date()) {
  const hour = date.getHours();
  const matched = hotStockRefreshHours.find((item) => item === hour);
  return matched ? `${date.toDateString()}-${matched}` : "";
}

function scheduleHotStockRefresh() {
  const slot = getHotStockSlot();
  if (!slot || slot === lastHotStockSlot) return;
  lastHotStockSlot = slot;
  loadHotStocks();
}

function renderSortButtons() {
  document.querySelectorAll(".segmented button").forEach((button) => {
    button.classList.toggle("active", button.dataset.sort === currentSort);
    button.onclick = () => { currentSort = button.dataset.sort; renderSectorList(); renderSortButtons(); };
  });
}

function getResearchModuleData(key) {
  const topSector = sectors[0] || selectedSector;
  const riskSector = sectors.find((sector) => sector.netInflow < 0) || sectors.at(-1) || selectedSector;
  const topHot = hotStocks[0];
  const selectedStock = rankSectorStocks(selectedSector.stocks || [])[0];
  const concept = getActiveConceptLabel(" + ") || getConceptStats(selectedSector.stocks || []).at(0)?.name || selectedSector.name;
  const commonKpis = [
    ["当前板块", selectedSector.name, selectedSector.signal],
    ["主力净流入", formatMoney(selectedSector.netInflow), "用于观察资金斜率"],
    ["热门概念", concept, "随总览选择联动"],
    ["复盘状态", "待记录", "先保留判断过程"],
  ];
  const modules = {
    capture: {
      eyebrow: "01 CAPTURE",
      title: "捕捉：今天发生了什么",
      subtitle: "把事件、新闻、公告、财报、电话会议、研报观点和行情异动先收进来。研究的第一步不是解释，而是把原始信号完整捕捉。",
      kpis: [
        ["行情异动", selectedSector.name, `${formatPercent(selectedSector.change)} / ${formatMoney(selectedSector.netInflow)}`],
        ["热门概念", concept, "来自当前总览联动"],
        ["热股线索", topHot?.name || "等待热榜", topHot ? `热度第 ${topHot.rank}` : "读取中"],
        ["信息来源", "A股 / 美股", "mcp-aktools + financial-datasets"],
      ],
      cards: [
        ["发生了什么", `${selectedSector.name}资金异动`, `当前净流入${formatMoney(selectedSector.netInflow)}，先记录为研究信号，不直接视为结论。`],
        ["A股来源", "mcp-aktools", "接入 A 股板块、龙虎榜、新闻、公告、财报和行情异动信息流。"],
        ["美股来源", "financial-datasets", "接入美股新闻、财报、电话会议和产业链映射线索。"],
        ["原始证据", "保留来源与时间", "捕捉阶段只做归档和去重，避免过早解释。"],
      ],
      steps: [
        ["输入", "捕捉事件", "新闻、公告、财报、电话会议、研报观点、行情异动", "进行中"],
        ["清洗", "标准化实体", "主题、行业、公司、发布时间、来源、证据等级", "待接入"],
        ["归档", "进入 Evidence Store", "所有后续判断都要能回溯到原始证据", "待做"],
      ],
    },
    connect: {
      eyebrow: "02 CONNECT",
      title: "连接：它会影响谁",
      subtitle: "把事件连接到行业、产业链节点、上下游、公司和市场预期。连接阶段回答的是影响路径，而不是涨跌判断。",
      kpis: commonKpis,
      cards: [
        ["影响行业", selectedSector.name, `当前从${selectedSector.name}出发，继续拆到主题、概念和产业链节点。`],
        ["产业链节点", concept, "判断它处在上游、中游还是下游，以及利润会往哪一环传导。"],
        ["相关公司", selectedStock?.name || topHot?.name || "等待个股数据", "把公司放到产业链位置里看，而不是只看涨幅。"],
      ],
      steps: [
        ["行业", "映射影响行业", selectedSector.name, "已选中"],
        ["节点", "梳理上下游", "上游 -> 中游 -> 下游 -> 公司", "待自动化"],
        ["预期", "连接市场预期", "人气、资金、新闻和财务指标", "待验证"],
      ],
    },
    compare: {
      eyebrow: "03 COMPARE",
      title: "比较：哪些是真影响，哪些是情绪",
      subtitle: "比较基本面影响、市场反应、资金流向和已有预期。比较阶段的价值是防止把热度误当成事实。",
      kpis: [
        ["市场反应", formatPercent(selectedSector.change), selectedSector.name],
        ["资金反应", formatMoney(selectedSector.netInflow), "主力净流入"],
        ["人气反应", topHot?.name || "等待热榜", topHot ? `热度第 ${topHot.rank}` : "读取中"],
        ["基本面证据", "待补充", "公告 / 财务 / 业绩"],
      ],
      cards: [
        ["已反应", "价格与资金", `${selectedSector.name}涨跌幅${formatPercent(selectedSector.change)}，净流入${formatMoney(selectedSector.netInflow)}。`],
        ["待验证", "基本面是否跟上", "需要比较公告、业绩、订单、价格和产能，而不是只看热度。"],
        ["可能噪音", riskSector.name, `若${riskSector.name}继续走弱，说明市场不是全面乐观，而是结构性切换。`],
      ],
      steps: [
        ["市场", "看价格和资金", "是否已经明显反应", "已记录"],
        ["基本面", "看公开证据", "财报、公告、电话会议、研报观点", "待接入"],
        ["预期差", "比较反应与证据", "判断是否只是情绪交易", "待判断"],
      ],
    },
    conclude: {
      eyebrow: "04 CONCLUDE",
      title: "判断：形成可追溯假设",
      subtitle: "生成可追溯的研究假设，而不是买卖指令。判断必须包含依据、不确定性、反证和待验证问题。",
      kpis: [
        ["研究对象", selectedSector.name, concept],
        ["初步假设", selectedSector.netInflow > 0 ? "资金关注增强" : "资金动能不足", "需证据确认"],
        ["置信度", "中低", "当前主要是行情证据"],
        ["反证", "待补充", "财务和事件数据"],
      ],
      cards: [
        ["假设", `${selectedSector.name}情绪升温`, `如果${concept}后续有公告、订单或业绩支撑，才可能从情绪线索升级为研究主线。`],
        ["依据", "资金与人气", `净流入${formatMoney(selectedSector.netInflow)}，量比${selectedSector.volumeRatio.toFixed(2)}x。`],
        ["不确定性", "基本面证据不足", "当前结论不能替代投资判断，只适合进入观察池。"],
      ],
      steps: [
        ["结论", "写出假设", "一句话说明为什么关注", "待保存"],
        ["证据", "列出支持与反对", "行情、资金、公告、财务、新闻", "待补充"],
        ["验证", "定义观察变量", "未来看什么能证明或推翻它", "待记录"],
      ],
    },
    commit: {
      eyebrow: "05 COMMIT",
      title: "记录：保留当时为什么这样想",
      subtitle: "保存观察、证据、疑问、置信度和风险。平台最重要的资产不是 AI 总结，而是你的研究过程。",
      kpis: [
        ["开放笔记", "0 条", "下一步本地存储"],
        ["当前对象", selectedSector.name, concept],
        ["建议字段", "8 个", "原因、证据、反证、置信度等"],
        ["复盘日期", "待设置", "7 / 30 天"],
      ],
      cards: [
        ["为什么关注", selectedSector.name, `因为${concept}出现资金或人气线索，但仍需验证是否有真实事件支撑。`],
        ["支持证据", "资金、热度、概念", `主力净流入${formatMoney(selectedSector.netInflow)}，当前信号为${selectedSector.signal}。`],
        ["反对证据", "容易遗漏", "记录反证可以防止只收集支持自己观点的信息。"],
      ],
      steps: [
        ["保存", "研究笔记", "对象、理由、证据、反证、疑问", "下一步"],
        ["标记", "置信度与风险", "不要把不确定的东西写成确定结论", "待做"],
        ["计划", "复盘日期", "未来自动提醒回看", "待做"],
      ],
    },
    check: {
      eyebrow: "06 CHECK",
      title: "复盘：判断是否需要修正",
      subtitle: "未来回看结果，判断哪些想法正确，哪些假设需要修正。复盘不是证明自己对，而是训练自己的研究系统。",
      kpis: [
        ["开放假设", "0 条", "下一步保存笔记"],
        ["待复盘", "0 条", "本地存储后启用"],
        ["当前证据", selectedSector.signal, selectedSector.name],
        ["复盘周期", "7 / 30 天", "建议周期"],
      ],
      cards: [
        ["判断记录", "为什么关注", `记录${selectedSector.name}是否因为事件、产业链、资金还是情绪。`],
        ["结果观察", "后来发生什么", "未来自动对比资金曲线、涨跌幅、热度和基本面事件。"],
        ["修正反馈", "哪些想法错了", "把错误模式沉淀成个人研究记忆。"],
      ],
      steps: [
        ["T0", "保存假设", "原因、证据、反证、置信度", "待做"],
        ["T+7", "短期复盘", "情绪是否延续，是否出现反证", "待做"],
        ["T+30", "逻辑复盘", "基本面是否兑现，预期是否收敛", "待做"],
      ],
    },
    daily: {
      eyebrow: "DAILY BRIEF",
      title: "研究日报",
      subtitle: "把今日事件、市场情绪、产业链线索、关注变化和待复盘问题整理成一份个人日报。",
      kpis: [
        ["今日主线", selectedSector.name, selectedSector.signal],
        ["关注概念", concept, "来自总览联动"],
        ["热股榜首", topHot?.name || "等待热榜", topHot ? formatPercent(topHot.change) : "读取中"],
        ["日报状态", "可生成", "当前为模板版"],
      ],
      cards: [
        ["今日发生", `${selectedSector.name}资金异动`, `主力净流入${formatMoney(selectedSector.netInflow)}，量比${selectedSector.volumeRatio.toFixed(2)}x。`],
        ["值得跟踪", concept, "关注是否有新闻、公告、财报或产业链变化支撑。"],
        ["风险提示", riskSector.name, `净流入弱或回落板块需要降低信号权重：${formatMoney(riskSector.netInflow)}。`],
      ],
      steps: [
        ["摘要", "市场情绪", "资金、指数、热股榜", "可生成"],
        ["研究", "主题与事件", "产业链传导、公司受益、预期差", "待接入"],
        ["复盘", "昨日判断", "旧笔记结果回看", "待本地存储"],
      ],
    },
  };
  return modules[key] || modules.connect;
}

function getFilteredCaptureItems() {
  return captureItems.filter((item) => {
    const typeMatched = captureFilter === "all" || item.type === captureFilter;
    const marketMatched = captureMarketFilter === "all" || item.market === captureMarketFilter;
    return typeMatched && marketMatched;
  });
}

function mapCaptureItemForUi(item) {
  const publishedAt = item.publishedAt ? new Date(item.publishedAt) : new Date();
  const companies = item.relatedCompanies?.length
    ? item.relatedCompanies.map((company) => company.name || company.code).filter(Boolean)
    : item.companies || [];
  return {
    ...item,
    time: Number.isNaN(publishedAt.getTime())
      ? String(item.publishedAt || "")
      : publishedAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    sector: item.relatedSectors?.[0] || item.sector || "待映射",
    concepts: item.relatedConcepts || item.concepts || [],
    companies,
    market: item.market || "A股",
    provider: item.provider || item.source || "",
    priority: item.priority || (item.confidence >= 70 ? "高" : item.confidence >= 55 ? "中" : "低"),
  };
}

async function loadCaptureFeed() {
  try {
    const response = await fetch(`${API_BASE}/api/capture?limit=30`);
    if (!response.ok) throw new Error("捕捉接口不可用");
    const data = await response.json();
    if (data.items?.length) {
      captureItems = data.items.map(mapCaptureItemForUi);
      selectedCaptureId = captureItems[0]?.id || selectedCaptureId;
      renderCaptureWorkbench();
    }
  } catch (_) {
    renderCaptureWorkbench();
  }
}

function renderCaptureWorkbench() {
  const workbench = $("#capture-workbench");
  if (!workbench) return;
  const isCapture = activeWorkspaceModule === "capture";
  workbench.hidden = !isCapture;
  $("#module-cards").hidden = isCapture;
  document.querySelector(".module-panel").hidden = isCapture;
  if (!isCapture) return;

  const filtered = getFilteredCaptureItems();
  const selected = filtered.find((item) => item.id === selectedCaptureId) || filtered[0] || captureItems[0];
  if (selected) selectedCaptureId = selected.id;

  $("#capture-filters").innerHTML = captureTypes.map(([key, label]) => {
    const count = key === "all" ? captureItems.length : captureItems.filter((item) => item.type === key).length;
    return `<button type="button" class="${captureFilter === key ? "active" : ""}" data-capture-filter="${key}">${label}<small>${count}</small></button>`;
  }).join("");

  $("#capture-market-filters").innerHTML = captureMarkets.map(([key, label]) => {
    const count = key === "all" ? captureItems.length : captureItems.filter((item) => item.market === key).length;
    return `<button type="button" class="${captureMarketFilter === key ? "active" : ""}" data-capture-market="${key}">${label}<small>${count}</small></button>`;
  }).join("");

  $("#capture-source-lanes").innerHTML = captureSourceLanes.map((lane) => {
    const laneItems = captureItems.filter((item) => item.market === lane.market);
    const providerNames = [...new Set(laneItems.map((item) => item.provider).filter(Boolean))];
    const connected = providerNames.some((name) => name.includes(lane.provider.split("/")[0]));
    const status = connected ? "已接入" : "待接入";
    const statusClass = connected ? "live" : "pending";
    return `
      <button class="capture-source-card ${captureMarketFilter === lane.market ? "active" : ""}" type="button" data-capture-market="${lane.market}">
        <span>${lane.market}</span>
        <strong>${lane.title}</strong>
        <p>${lane.scope}</p>
        <div>
          <em>${lane.provider}</em>
          <small class="${statusClass}">${status} · ${laneItems.length} 条</small>
        </div>
        <small>${lane.route}</small>
      </button>
    `;
  }).join("");

  $("#capture-stream-title").textContent = captureFilter === "all"
    ? `${captureMarketFilter === "all" ? "全部" : captureMarketFilter}信号`
    : `${captureTypes.find(([key]) => key === captureFilter)?.[1] || "捕捉"}信号`;

  $("#capture-list").innerHTML = filtered.map((item) => `
    <button class="capture-item ${item.id === selectedCaptureId ? "active" : ""}" type="button" data-capture-id="${item.id}">
      <span class="capture-type">${item.typeLabel}</span>
      <div>
        <strong>${item.title}</strong>
        <p>${item.summary}</p>
        <small>${item.market} · ${item.provider || item.source} · ${item.time} · ${item.sector}</small>
      </div>
      <em>${item.priority}</em>
    </button>
  `).join("");

  $("#capture-detail").innerHTML = selected ? `
    <p class="eyebrow">${selected.market} · ${selected.typeLabel} · ${selected.provider || selected.source}</p>
    <h3>${selected.title}</h3>
    <div class="capture-detail-meta">
      <span>${selected.time}</span>
      <span>${selected.sector}</span>
      <span>${selected.status}</span>
    </div>
    <p class="capture-summary">${selected.summary}</p>
    <div class="capture-chip-row">
      ${selected.concepts.map((concept) => `<span>${concept}</span>`).join("")}
    </div>
    <section class="capture-impact">
      <h4>影响路径</h4>
      <div>${selected.impactPath.map((node) => `<span>${node}</span>`).join("")}</div>
    </section>
    <section class="capture-companies">
      <h4>相关公司</h4>
      <div>${selected.companies.map((company) => `<button type="button">${company}</button>`).join("")}</div>
    </section>
    <section class="capture-next">
      <h4>下一步</h4>
      <p>${selected.nextAction}</p>
    </section>
    <div class="capture-actions">
      <button type="button" data-capture-action="agent">AI 整理证据</button>
      <button type="button" data-capture-action="chain">加入研究链</button>
      <button type="button" data-capture-action="review">标记待研判</button>
      <button type="button" data-capture-action="ignore">忽略噪音</button>
    </div>
  ` : `<p class="search-empty">暂无捕捉信号。</p>`;

  $("#capture-filters").querySelectorAll("button").forEach((button) => {
    button.onclick = () => {
      captureFilter = button.dataset.captureFilter;
      selectedCaptureId = getFilteredCaptureItems()[0]?.id || selectedCaptureId;
      renderCaptureWorkbench();
    };
  });
  $("#capture-market-filters").querySelectorAll("button").forEach((button) => {
    button.onclick = () => {
      captureMarketFilter = button.dataset.captureMarket;
      selectedCaptureId = getFilteredCaptureItems()[0]?.id || selectedCaptureId;
      renderCaptureWorkbench();
    };
  });
  $("#capture-source-lanes").querySelectorAll("[data-capture-market]").forEach((button) => {
    button.onclick = () => {
      captureMarketFilter = button.dataset.captureMarket;
      selectedCaptureId = getFilteredCaptureItems()[0]?.id || selectedCaptureId;
      renderCaptureWorkbench();
    };
  });
  $("#capture-list").querySelectorAll(".capture-item").forEach((button) => {
    button.onclick = () => {
      selectedCaptureId = button.dataset.captureId;
      renderCaptureWorkbench();
    };
  });
  $("#capture-detail").querySelectorAll("[data-capture-action]").forEach((button) => {
    button.onclick = () => {
      const item = captureItems.find((entry) => entry.id === selectedCaptureId);
      if (!item) return;
      if (button.dataset.captureAction === "agent") {
        openAiAgent({
          title: "AI 整理证据",
          presetQuestion: `请基于这条捕捉信息，按研究闭环整理：发生了什么、影响哪些行业、产业链如何传导、相关公司、证据强弱、待验证问题、风险提示。\n\n标题：${item.title}\n摘要：${item.summary}`,
          extraContext: { captureItem: item, workflowStep: "capture" },
        });
        return;
      }
      const actionMap = { chain: "已加入研究链", review: "待研判", ignore: "已忽略" };
      item.status = actionMap[button.dataset.captureAction] || item.status;
      renderCaptureWorkbench();
    };
  });
}

function renderResearchModule() {
  if (activeWorkspaceModule === "overview") return;
  const data = getResearchModuleData(activeWorkspaceModule);
  $("#module-eyebrow").textContent = data.eyebrow;
  $("#module-title").textContent = data.title;
  $("#module-subtitle").textContent = data.subtitle;
  $("#module-kpis").innerHTML = data.kpis.map(([label, value, note]) => `
    <article class="module-kpi">
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${note}</small>
    </article>
  `).join("");
  $("#module-cards").innerHTML = data.cards.map(([label, title, body]) => `
    <article class="module-card">
      <span>${label}</span>
      <strong>${title}</strong>
      <p>${body}</p>
    </article>
  `).join("");
  $("#module-panel-title").textContent = `${data.title}链路`;
  $("#module-timeline").innerHTML = data.steps.map(([time, title, body, status]) => `
    <article class="timeline-item">
      <time>${time}</time>
      <div>
        <strong>${title}</strong>
        <small>${body}</small>
      </div>
      <em>${status}</em>
    </article>
  `).join("");
  renderCaptureWorkbench();
}

function switchWorkspaceModule(moduleName) {
  activeWorkspaceModule = moduleName;
  document.querySelectorAll(".sidebar-nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.module === moduleName);
  });
  const isOverview = moduleName === "overview";
  $("#overview-view").hidden = !isOverview;
  $("#research-module-view").hidden = isOverview;
  if (isOverview) {
    requestAnimationFrame(() => flowChart?.resize());
  } else {
    renderResearchModule();
  }
}

function setupSidebarNavigation() {
  document.querySelectorAll(".sidebar-nav button").forEach((button) => {
    button.onclick = () => switchWorkspaceModule(button.dataset.module);
  });
  document.querySelector(".primary-action").onclick = () => {
    if (activeWorkspaceModule !== "capture") {
      switchWorkspaceModule("capture");
      return;
    }
    $("#capture-workbench")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
}

function renderSearchResults(items, query) {
  const panel = $("#search-results");
  if (!query) {
    panel.hidden = true;
    panel.innerHTML = "";
    return;
  }
  if (!items.length) {
    panel.hidden = false;
    panel.innerHTML = `<div class="search-meta">全局搜索 · 证券目录完整</div><p class="search-empty">没有找到匹配的 A 股证券。</p>`;
    return;
  }
  panel.hidden = false;
  panel.innerHTML = `
    <div class="search-meta">全局搜索 · 证券目录完整</div>
    ${items.map((item) => `
      <button class="search-result-item" type="button" data-code="${item.code}" data-name="${item.name}">
        <span class="search-result-icon">${item.type.includes("指数") ? "↗" : "▥"}</span>
        <div>
          <strong>${item.name}</strong>
          <small>${item.code}.${item.market} · ${item.type}${item.industry ? ` · ${item.industry}` : ""}</small>
        </div>
        <em>${Number.isFinite(item.change) ? formatPercent(item.change) : "查看"}</em>
      </button>
    `).join("")}
  `;
  panel.querySelectorAll(".search-result-item").forEach((button) => {
    button.onclick = () => {
      $("#global-search-input").value = button.dataset.name;
      panel.hidden = true;
      $("#search-results").innerHTML = `
        <div class="search-meta">已选择 · stock-sdk 搜索目录</div>
        <div class="selected-security">
          <strong>${button.dataset.name}</strong>
          <span>${button.dataset.code}</span>
          <p>下一步会把搜索结果接到公司画像、资金流、公告和研究笔记。</p>
        </div>
      `;
      $("#search-results").hidden = false;
    };
  });
}

async function searchSecurities(query) {
  if (lastSearchController) lastSearchController.abort();
  lastSearchController = new AbortController();
  const panel = $("#search-results");
  panel.hidden = false;
  panel.innerHTML = `<div class="search-meta">全局搜索 · 证券目录完整</div><p class="search-empty">正在加载市场数据...</p>`;
  try {
    const response = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`, { signal: lastSearchController.signal });
    if (!response.ok) throw new Error("搜索接口不可用");
    const data = await response.json();
    renderSearchResults(data.items || [], query);
  } catch (error) {
    if (error.name === "AbortError") return;
    panel.innerHTML = `<div class="search-meta">全局搜索 · 证券目录完整</div><p class="search-empty">搜索暂不可用。请确认本地服务已打开：127.0.0.1:4173。</p>`;
  }
}

function setupGlobalSearch() {
  const input = $("#global-search-input");
  input.addEventListener("input", () => {
    const query = input.value.trim();
    clearTimeout(searchTimer);
    if (!query) return renderSearchResults([], "");
    searchTimer = setTimeout(() => searchSecurities(query), 220);
  });
  input.addEventListener("focus", () => {
    if (!input.value.trim() && $("#search-results").hidden) {
      renderSearchResults([
        { name: "上证指数", code: "000001", market: "SH", type: "A股指数", industry: "主要市场", change: NaN },
        { name: "沪深300", code: "000300", market: "SH", type: "A股指数", industry: "宽基指数", change: NaN },
        { name: "科创50", code: "000688", market: "SH", type: "A股指数", industry: "科技成长", change: NaN },
      ], "starter");
    }
  });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      input.focus();
    }
    if (event.key === "Escape") {
      $("#search-results").hidden = true;
      hideActionPopover();
      closeUtilityModal();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-area")) {
      $("#search-results").hidden = true;
    }
  });
}

function toggleLanguage() {
  currentLanguage = currentLanguage === "zh" ? "en" : "zh";
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
  $("#language-btn").textContent = currentLanguage === "zh" ? "文" : "EN";
  document.querySelector(".brand-subtitle").textContent = currentLanguage === "zh"
    ? "持续追踪投资逻辑，而不是追逐股价。把事件、产业链、公司和个人判断沉淀成可复盘的研究链。"
    : "Track investment logic instead of chasing prices. Turn events, supply chains, companies and your own reasoning into reviewable research memory.";
  hideActionPopover();
}

function toggleTheme() {
  document.body.classList.toggle("light-theme");
  const isLight = document.body.classList.contains("light-theme");
  $("#theme-btn").textContent = isLight ? "☾" : "☼";
  hideActionPopover();
  flowChart?.resize();
}

function showResearchCalendar() {
  const today = new Date();
  const items = [
    ["今日", "捕捉市场异动与重要事件"],
    ["T+7", "复盘短期情绪是否延续"],
    ["T+30", "复盘基本面证据是否兑现"],
  ];
  showActionPopover($("#calendar-btn"), `
    <div class="popover-head">
      <span>研究日历</span>
      <strong>${today.toLocaleDateString("zh-CN")}</strong>
    </div>
    <div class="popover-list">${items.map(([time, text]) => `<article><strong>${time}</strong><span>${text}</span></article>`).join("")}</div>
  `);
}

function showNotifications() {
  const notices = [
    ["系统", "AKShare 数据源接入规格已建立，等待实现 Python Data Service。"],
    ["搜索", "A 股证券目录检索已接入 stock-sdk 搜索工具。"],
    ["AI", "AI Agent 需要 OPENAI_API_KEY 与价格参数后启用真实计费。"],
  ];
  showActionPopover($("#notification-btn"), `
    <div class="popover-head">
      <span>系统通知</span>
      <strong>32</strong>
    </div>
    <div class="popover-list">${notices.map(([label, text]) => `<article><strong>${label}</strong><span>${text}</span></article>`).join("")}</div>
  `);
}

function openAiAgent(options = {}) {
  const { title = "询问 AI", presetQuestion = "", extraContext = {} } = options;
  showUtilityModal({
    eyebrow: "FINANCIAL AGENT",
    title,
    body: `
      <form id="ai-agent-form" class="ai-agent-form">
        <textarea id="ai-agent-question" rows="5" placeholder="例如：今天机器人板块是真受益还是情绪交易？">${presetQuestion}</textarea>
        <button type="submit">发送问题</button>
      </form>
      <div id="ai-agent-result" class="ai-agent-result">
        <p>后端会按 token 统计输入和输出。未配置 API Key 时只显示计费接入状态。</p>
      </div>
    `,
  });
  $("#ai-agent-form").onsubmit = async (event) => {
    event.preventDefault();
    const question = $("#ai-agent-question").value.trim();
    if (!question) return;
    const result = $("#ai-agent-result");
    result.innerHTML = "<p>正在调用金融 Agent...</p>";
    try {
      const response = await fetch(`${API_BASE}/api/agent/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: {
            sector: selectedSector,
            concepts: activeConcepts,
            hotStocks: hotStocks.slice(0, 5),
            marketIndex: marketIndex?.flow?.at(-1),
            ...extraContext,
          },
        }),
      });
      const data = await response.json();
      result.innerHTML = `
        <strong>${data.configured ? "AI Agent 已响应" : "AI Agent 待配置"}</strong>
        <p>${data.answer}</p>
        <div class="token-meter">
          <span>模型：${data.model}</span>
          <span>输入 ${data.usage.inputTokens} tokens</span>
          <span>输出 ${data.usage.outputTokens} tokens</span>
          <span>估算费用：${data.billing.currency} ${data.billing.estimatedCost}</span>
        </div>
      `;
    } catch (_) {
      result.innerHTML = "<p>AI Agent 暂不可用，请检查服务和 API Key。</p>";
    }
  };
}

function setupUtilityActions() {
  $("#language-btn").onclick = toggleLanguage;
  $("#theme-btn").onclick = toggleTheme;
  $("#calendar-btn").onclick = showResearchCalendar;
  $("#notification-btn").onclick = showNotifications;
  $("#ask-ai-btn").onclick = openAiAgent;
  $("#utility-close-btn").onclick = closeUtilityModal;
  $("#utility-modal").addEventListener("click", (event) => {
    if (event.target.id === "utility-modal") closeUtilityModal();
  });
  $("#market-modal-close").onclick = closeMarketModal;
  $("#market-modal").addEventListener("click", (event) => {
    if (event.target.id === "market-modal") closeMarketModal();
  });
  $("#stock-modal-close").onclick = closeStockModal;
  $("#stock-modal").addEventListener("click", (event) => {
    if (event.target.id === "stock-modal") closeStockModal();
  });
  document.querySelectorAll(".market-card").forEach((card) => {
    const openMarket = () => showMarketModal(marketOverview[Number(card.dataset.marketIndex)]);
    card.addEventListener("click", openMarket);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openMarket();
      }
    });
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".topbar-actions")) hideActionPopover();
  });
}

function render() {
  renderSummary(); renderSectorList(); renderDetail(); renderStocks(); renderAiBrief(); renderReport(); renderInsights(); renderChartDigest(); renderLegend(); renderSortButtons(); renderReportTabs(); animateChart(); renderResearchModule(); renderCaptureWorkbench();
}

async function loadMarketData() {
  const refresh = $("#refresh-btn");
  refresh.classList.add("loading");
  try {
    const response = await fetch(`${API_BASE}/api/market`);
    if (!response.ok) throw new Error("实时接口不可用");
    const data = await response.json();
    if (!data.sectors?.length) throw new Error("实时接口暂无数据");
    sectors = data.sectors;
    if (data.marketIndex?.flow?.length) marketIndex = data.marketIndex;
    if (data.marketOverview?.length) marketOverview = data.marketOverview;
    selectedSector = sectors.find((sector) => sector.code === selectedSector.code) || sectors[0];
    activeLines = new Set(sectors.slice(0, 8).map((sector) => sector.code));
    $("#data-source").textContent = data.source || "stock-sdk 数据工具";
    $("#data-source").className = "source-badge live";
    $("#data-time").textContent = `更新 ${new Date(data.asOf).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
    render();
    await loadStocks(selectedSector);
  } catch (_) {
    $("#data-source").textContent = "演示数据";
    $("#data-source").className = "source-badge demo";
    $("#data-time").textContent = "接口不可用，已降级";
  } finally {
    refresh.classList.remove("loading");
  }
}

$("#refresh-btn").addEventListener("click", () => {
  loadMarketData();
  loadHotStocks();
});
new ResizeObserver(() => {
  flowChart?.resize();
  stockChart?.resize();
}).observe($("#flow-chart-stage"));

updateClock();
setupSidebarNavigation();
setupGlobalSearch();
setupUtilityActions();
render();
loadMarketData();
loadHotStocks();
loadCaptureFeed();
setInterval(updateClock, 1000);
setInterval(loadMarketData, 60_000);
setInterval(scheduleHotStockRefresh, 60_000);
