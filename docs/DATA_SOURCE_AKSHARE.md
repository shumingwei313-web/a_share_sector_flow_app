# AKShare 数据源接入

## 定位

AKShare 作为情绪之道的 A 股核心研究数据源，负责补齐当前东方财富公开行情代理之外的结构化数据能力。

当前项目使用 Node.js 直接代理东方财富网页端点。AKShare 以两种方式接入：

- 本地开发：Node 可以直接 spawn Python 调用 AKShare，失败后降级 Demo。
- 线上部署：推荐使用独立 Python Data Service，由 Node 通过 `AKSHARE_SERVICE_URL` 调用。

```text
Web UI
-> Node API
-> Data Provider Router
   -> Eastmoney Adapter: 实时行情、热股榜、板块分时
   -> AKShare Adapter: 资金流、概念、财务、公告、宏观、产业研究数据
```

## 优先接口

根据 AKShare 官方文档，第一阶段优先关注这些接口：

| 能力 | AKShare 接口 | 用途 |
| --- | --- | --- |
| 行业资金流 | `stock_fund_flow_industry` | 获取行业板块即时、3日、5日、10日、20日资金流 |
| 概念资金流 | `stock_fund_flow_concept` | 获取概念板块资金流，支持热门概念挖掘 |
| 个股资金流 | `stock_individual_fund_flow` | 获取某只股票近 100 个交易日资金流 |
| 个股资金流排名 | `stock_individual_fund_flow_rank` | 获取市场个股资金流排名 |
| 板块资金流排名 | `stock_sector_fund_flow_rank` | 获取板块资金排名 |
| 行业个股资金流 | `stock_sector_fund_flow_summary` | 获取某行业下个股资金流 |
| 行业历史资金流 | `stock_sector_fund_flow_hist` | 获取行业历史资金变化 |
| 概念历史资金流 | `stock_concept_fund_flow_hist` | 获取概念历史资金变化 |
| 财务摘要 | `stock_financial_abstract` | 个股基本面摘要 |
| 财务指标 | `stock_financial_analysis_indicator` | ROE、毛利率、负债率等指标 |
| 业绩预告 | `stock_yjyg_em` | 事件和预期差来源 |
| 业绩快报 | `stock_yjkb_em` | 公司事件来源 |
| 业绩报告 | `stock_yjbb_em` | 财报事件来源 |
| 大盘资金流 | `stock_market_fund_flow` | 市场情绪总览 |

## 第一阶段数据映射

### Sector

AKShare 行业或概念资金流统一映射为：

```json
{
  "code": "ak_concept_机器人",
  "name": "机器人",
  "type": "concept",
  "netInflow": 12.4,
  "inflow": 48.2,
  "outflow": 35.8,
  "change": 3.2,
  "companyCount": 86,
  "leader": "某领涨股",
  "leaderChange": 8.6,
  "source": "akshare.stock_fund_flow_concept",
  "asOf": "2026-08-03T10:30:00+08:00"
}
```

### Stock

行业个股资金流统一映射为：

```json
{
  "code": "002472",
  "name": "双环传动",
  "price": 32.18,
  "change": 1.2,
  "netInflow": 32000000,
  "netInflowRatio": 2.4,
  "largeOrderInflow": 12000000,
  "concepts": ["机器人", "减速器", "新能源汽车"],
  "source": "akshare.stock_sector_fund_flow_summary"
}
```

### Event

业绩预告、业绩快报和公告类数据统一映射为：

```json
{
  "id": "event_stock_yjyg_002472_20260803",
  "type": "earnings_forecast",
  "title": "双环传动发布业绩预告",
  "publishedAt": "2026-08-03",
  "entities": ["双环传动", "机器人", "减速器"],
  "evidenceLevel": "L1",
  "source": "akshare.stock_yjyg_em"
}
```

## 接入方式

推荐新增 Python 服务：

```text
services/akshare_service/
  app.py
  requirements.txt
  adapters/
    market.py
    sector.py
    concept.py
    stock.py
    event.py
```

Node 后端调用 Python 服务：

```text
GET http://127.0.0.1:8765/akshare/sector-flow?type=concept&period=即时
GET http://127.0.0.1:8765/akshare/sector/:name/stocks
GET http://127.0.0.1:8765/akshare/stock/:code/fund-flow
GET http://127.0.0.1:8765/akshare/events/earnings
```

当前项目已落地：

```text
src/infrastructure/data-sources/akshareCaptureProvider.js
  本地 Python spawn 方式。

src/infrastructure/data-sources/akshareServiceCaptureProvider.js
  线上 Python HTTP 服务方式。

services/akshare_service/app.py
  FastAPI + AKShare 服务。

/api/capture
  Node 统一捕捉接口。
```

## 降级策略

- AKShare 服务不可用：回退到当前东方财富实时代理。
- 单个接口失败：保留页面，用演示数据或缓存数据补位。
- 数据字段缺失：通过标准化层补默认值，不让前端直接处理脏数据。
- 频控或被拦截：缓存延长到 60-300 秒，并提示数据状态。

## 合规边界

AKShare 适合作为个人研究和本地原型的数据工具。正式公开部署或商业化时，需要确认每个上游数据源的授权边界、频控要求和再分发限制。
