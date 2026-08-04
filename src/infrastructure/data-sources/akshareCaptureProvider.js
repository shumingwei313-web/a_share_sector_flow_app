const { spawn } = require("node:child_process");
const { CAPTURE_TYPES, EVIDENCE_LEVELS, normalizeCaptureItem } = require("../../domain/captureItem");

const PYTHON_BIN = process.env.AKSHARE_PYTHON || "python3";
const SCRIPT = `
import json
import sys
from datetime import datetime, timezone

try:
    import akshare as ak
except Exception as exc:
    print(json.dumps({"ok": False, "error": f"akshare unavailable: {exc}"}))
    sys.exit(0)

def rows_from_df(df, limit=12):
    if df is None:
        return []
    records = df.head(limit).fillna("").to_dict("records")
    return records

def latest_report_date():
    local_now = datetime.now()
    if local_now.month <= 4:
        return f"{local_now.year - 1}1231"
    if local_now.month <= 8:
        return f"{local_now.year}0630"
    if local_now.month <= 10:
        return f"{local_now.year}0930"
    return f"{local_now.year}1231"

items = []
now = datetime.now(timezone.utc).isoformat()

try:
    # 业绩预告/快报/报告可以作为财报捕捉入口；字段随上游会有差异，Node 侧再做标准化。
    for row in rows_from_df(ak.stock_yjyg_em(date=latest_report_date()), 8):
        name = str(row.get("股票简称") or row.get("证券简称") or row.get("名称") or "")
        code = str(row.get("股票代码") or row.get("证券代码") or row.get("代码") or "")
        title = f"{name} 业绩预告" if name else "业绩预告"
        items.append({
            "id": f"ak-yjyg-{code}-{row.get('公告日期', '')}",
            "type": "financial_report",
            "title": title,
            "source": "akshare.stock_yjyg_em",
            "publishedAt": str(row.get("公告日期") or now),
            "relatedCompanies": [{"name": name, "code": code}] if name else [],
            "summary": "业绩预告捕捉项，需抽取利润变动、同比区间、原因说明，并与市场预期比较。",
            "impactPath": ["财报", "业绩预告", "利润变化", "预期差"],
            "evidenceLevel": "L1_OFFICIAL",
            "confidence": 70,
            "status": "captured"
        })
except Exception:
    pass

try:
    # 个股资金流排名作为行情异动捕捉入口。
    for row in rows_from_df(ak.stock_individual_fund_flow_rank(indicator="即时"), 8):
        name = str(row.get("名称") or row.get("股票简称") or "")
        code = str(row.get("代码") or row.get("股票代码") or "")
        net = row.get("主力净流入-净额") or row.get("主力净流入") or ""
        items.append({
            "id": f"ak-fund-rank-{code}",
            "type": "market_anomaly",
            "title": f"{name} 主力资金异动" if name else "主力资金异动",
            "source": "akshare.stock_individual_fund_flow_rank",
            "publishedAt": now,
            "relatedCompanies": [{"name": name, "code": code}] if name else [],
            "summary": f"个股资金流排名出现异动，主力净流入字段：{net}。资金只作为证据，不直接生成买卖结论。",
            "impactPath": ["行情异动", "个股资金", "所属行业/概念", "公告与财报验证"],
            "evidenceLevel": "L5_MARKET",
            "confidence": 55,
            "status": "captured"
        })
except Exception:
    pass

print(json.dumps({"ok": True, "items": items}, ensure_ascii=False))
`;

async function fetchCaptureItems() {
  const result = await runPythonAkshare();
  if (!result.ok) throw new Error(result.error || "AKShare 捕捉服务不可用");
  return (result.items || []).map(mapAkshareItem);
}

function runPythonAkshare() {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, ["-c", SCRIPT], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error("AKShare 调用超时"));
    }, Number(process.env.AKSHARE_TIMEOUT_MS || 15_000));

    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(stdout || "{}"));
      } catch (_) {
        reject(new Error(stderr || "AKShare 返回无法解析"));
      }
    });
  });
}

function mapAkshareItem(item) {
  return normalizeCaptureItem({
    ...item,
    type: item.type === CAPTURE_TYPES.FINANCIAL_REPORT ? CAPTURE_TYPES.FINANCIAL_REPORT : item.type,
    evidenceLevel: item.evidenceLevel || EVIDENCE_LEVELS.DATA,
  });
}

module.exports = { fetchCaptureItems };
