# spec: 捕捉模块 Clean Architecture 竖切

## 背景

捕捉是研究闭环第一步，负责收集事件、新闻、公告、财报、电话会议、研报观点和行情异动。它不能直接等同于结论，也不能让前端依赖某一个上游数据源。

## 用户故事

作为个人投资者，我希望系统把不同来源的信息统一整理成可追溯的 CaptureItem，方便我后续连接行业、比较预期差、形成判断、记录和复盘。

## 验收标准

Given AKShare 可用  
When 用户打开捕捉模块  
Then 系统通过 `/api/capture` 返回真实 AKShare 捕捉项，并保留 source、publishedAt、evidenceLevel。

Given AKShare 不可用  
When 用户打开捕捉模块  
Then 系统降级返回 DemoProvider 数据，页面仍可使用，并标记 degraded。

Given 捕捉项类型为财报  
When Application 用例处理数据  
Then 返回标准 CaptureItem，包含 relatedCompanies、summary、impactPath 和 nextAction。

## 数据需求

统一领域对象：

```text
CaptureItem
  id
  type: news | announcement | financial_report | earnings_call | research_view | market_anomaly
  title
  source
  sourceUrl
  publishedAt
  relatedSectors
  relatedConcepts
  relatedCompanies
  summary
  impactPath
  evidenceLevel
  confidence
  status
  nextAction
```

## 架构约束

```text
interfaces/http -> application -> domain
infrastructure/data-sources -> domain
application 不能直接依赖具体 AKShare 文件
domain 不能依赖 fetch、HTTP、文件系统、数据库、DOM 或模型 API
```

## 测试计划

- Unit：`normalizeCaptureItem` 字段归一化、类型兜底、置信度边界。
- Integration：`getCaptureFeed` 合并 provider、单 provider 失败时降级、按 type 筛选。
- Architecture：依赖方向护栏，防止 domain/application 越界依赖。
- E2E：后续用 Playwright 覆盖打开捕捉模块、筛选类型、查看详情、加入研究链。

## 风险与边界

- AKShare 适合作为本地个人研究数据源，公开部署或商业化前需要确认上游授权。
- 电话会议和研报观点可能不完全由 AKShare 覆盖，后续应通过 MCP、RSS、网页检索或本地上传补齐。
- 捕捉模块只做证据收集，不输出确定买卖建议。
