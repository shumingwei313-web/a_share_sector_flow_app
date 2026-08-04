# 架构设计

## 架构选择

项目采用 DDD + Clean Architecture 的混合方向，但按当前 MVP 阶段轻量落地。

核心想法：

```text
domain: 金融投研领域模型和纯规则
application: 用例编排，例如生成市场总览、筛选概念股、生成报告
infrastructure: 外部数据源、缓存、数据库、模型调用
interfaces: HTTP API、MCP tools、Web UI
```

当前代码仍是 `server.js + app.js` 的单体结构。后续重构时按下面结构迁移。

捕捉模块已经先落地一条 Clean Architecture 竖切：

```text
HTTP /api/capture
-> src/interfaces/http/captureController.js
-> src/application/getCaptureFeed.js
-> provider interface
-> src/infrastructure/data-sources/akshareCaptureProvider.js
-> src/domain/captureItem.js
```

这一条竖切用于承接新闻、公告、财报、电话会议、研报观点和行情异动。前端只消费标准化后的 CaptureItem，不直接知道 AKShare、东方财富或未来 MCP 的字段结构。

## 目标目录

```text
src/
  domain/
    market/
    sector/
    concept/
    stock/
    event/
    supply-chain/
    research/
    risk/
    decision/
    evidence/
    expectation/
  application/
    use-cases/
    services/
  infrastructure/
    data-sources/
      eastmoney/
      akshare/
      financial-datasets/
    cache/
    storage/
    llm/
  interfaces/
    http/
    mcp/
    web/
  shared/
    types/
    validation/
    errors/
tests/
  unit/
  integration/
  e2e/
docs/
  adr/
specs/
scripts/
```

## 领域边界

- Market：大盘指数、市场情绪、风险偏好、全市场资金。
- Sector：板块排名、板块资金曲线、板块强度、轮动状态。
- Concept：板块下的热门概念、概念热度、概念相关个股。
- Stock：个股价格、涨跌幅、资金净流入、人气、标签和信号。
- Event：新闻、公告、财报、电话会议、研报观点和行情异动。
- SupplyChain：产业链节点、上下游关系、传导路径和相关公司。
- Evidence：证据来源、证据等级、引用、可信度和更新时间。
- Expectation：市场反应、预期差、已定价程度和待验证变量。
- Research：AI 报告、日报、板块分析、个股观察。
- Risk：放量回落、资金背离、高位分歧、热度衰减。
- Decision：用户关注、观察理由、假设、结果复盘。

## 依赖规则

- `domain` 不能依赖 `infrastructure`、HTTP、DOM、fetch、数据库或模型 API。
- `application` 可以调用 `domain`，但只能通过接口使用数据源。
- `infrastructure` 负责适配东方财富、AKShare、MCP、数据库和 LLM。
- `interfaces/http` 只负责请求响应，不放复杂业务规则。
- `interfaces/web` 只负责展示状态，不直接拼接外部数据源 URL。

## 数据流

```text
Web UI
-> HTTP API
-> Application Use Case
-> Data Source Adapter
-> External Data / Cache
-> Event Normalization
-> Entity Linking
-> Supply Chain Mapping
-> Domain Rules
-> Response View Model
-> Web UI
```

## 数据源路由

早期保留东方财富作为实时行情和热股榜来源，同时把 AKShare 作为更完整的 A 股研究数据源。

```text
DataProviderRouter
  EastmoneyProvider: realtime market, sector intraday flow, hot stocks
  AkshareProvider: industry flow, concept flow, stock fund flow, finance, earnings events
  DemoProvider: fallback data
```

前端只调用项目自己的 `/api/*`，不直接知道上游来自哪里。

## AI 与 MCP 位置

MCP 是工具层，负责让 AI 能取数和执行受控动作。Skills 是方法层，负责告诉 AI 如何分析。

```text
Research Agent
-> calls MCP tools
-> receives structured data
-> applies Skills
-> generates traceable report
```

早期先用 HTTP API 模拟 MCP 工具；当 API 边界稳定后，再把同一批 use cases 暴露为 MCP tools。

## 研究链路

新的核心链路是：

```text
Event
-> Industry
-> SupplyChainNode
-> Company
-> Evidence
-> ExpectationGap
-> ResearchNote
-> Review
```

行情、资金和热度只作为链路中的证据之一。
