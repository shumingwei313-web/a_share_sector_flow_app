from datetime import datetime, timezone
from typing import Any

import akshare as ak
from fastapi import FastAPI, Query

app = FastAPI(title="Qingxu AKShare Data Service", version="0.1.0")


def latest_report_date() -> str:
    now = datetime.now()
    if now.month <= 4:
        return f"{now.year - 1}1231"
    if now.month <= 8:
        return f"{now.year}0630"
    if now.month <= 10:
        return f"{now.year}0930"
    return f"{now.year}1231"


def records(df: Any, limit: int) -> list[dict[str, Any]]:
    if df is None:
        return []
    return df.head(limit).fillna("").to_dict("records")


def company(name: str, code: str = "") -> dict[str, str]:
    return {"name": str(name or ""), "code": str(code or "")}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "source": "akshare"}


@app.get("/capture")
def capture(limit: int = Query(default=30, ge=1, le=80)) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    now = datetime.now(timezone.utc).isoformat()

    try:
        for row in records(ak.stock_yjyg_em(date=latest_report_date()), min(limit, 12)):
            name = row.get("股票简称") or row.get("证券简称") or row.get("名称") or ""
            code = row.get("股票代码") or row.get("证券代码") or row.get("代码") or ""
            items.append({
                "id": f"ak-yjyg-{code}-{row.get('公告日期', '')}",
                "type": "financial_report",
                "title": f"{name} 业绩预告" if name else "业绩预告",
                "source": "akshare.stock_yjyg_em",
                "publishedAt": str(row.get("公告日期") or now),
                "relatedCompanies": [company(name, code)] if name else [],
                "summary": "业绩预告捕捉项，需抽取利润变动、同比区间、原因说明，并与市场预期比较。",
                "impactPath": ["财报", "业绩预告", "利润变化", "预期差"],
                "evidenceLevel": "L1_OFFICIAL",
                "confidence": 70,
                "status": "captured",
            })
    except Exception:
        pass

    try:
        for row in records(ak.stock_individual_fund_flow_rank(indicator="即时"), min(limit, 12)):
            name = row.get("名称") or row.get("股票简称") or ""
            code = row.get("代码") or row.get("股票代码") or ""
            net = row.get("主力净流入-净额") or row.get("主力净流入") or ""
            items.append({
                "id": f"ak-fund-rank-{code}",
                "type": "market_anomaly",
                "title": f"{name} 主力资金异动" if name else "主力资金异动",
                "source": "akshare.stock_individual_fund_flow_rank",
                "publishedAt": now,
                "relatedCompanies": [company(name, code)] if name else [],
                "summary": f"个股资金流排名出现异动，主力净流入字段：{net}。资金只作为证据，不直接生成买卖结论。",
                "impactPath": ["行情异动", "个股资金", "所属行业/概念", "公告与财报验证"],
                "evidenceLevel": "L5_MARKET",
                "confidence": 55,
                "status": "captured",
            })
    except Exception:
        pass

    return {
        "source": "akshare",
        "asOf": now,
        "items": items[:limit],
    }
