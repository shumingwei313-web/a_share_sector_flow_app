# spec: AKShare 数据源接入

## 背景

当前情绪之道依赖 Node 后端直接请求东方财富公开端点，适合原型验证，但数据能力偏行情和资金。为了支持个人研究操作系统，需要接入更丰富的 A 股结构化数据，包括行业资金、概念资金、个股资金、财务摘要、业绩事件和宏观数据。

## 用户故事

作为个人投资者，我希望平台能从 AKShare 获取更完整的 A 股数据，让我不仅看到资金流向，还能追踪热门概念、公司基本面、业绩事件和后续复盘依据。

## 第一阶段目标

- 新增独立 AKShare 数据服务。
- Node 后端保留现有东方财富实时接口，同时可以调用 AKShare 服务。
- 前端仍使用统一 `/api/*`，不感知数据源变化。
- 数据响应统一带 `source`、`asOf` 和 `fallback` 字段。

## 第一阶段接口

```text
GET /api/data-sources
GET /api/akshare/sector-flow?type=industry|concept&period=即时|3日排行|5日排行|10日排行|20日排行
GET /api/akshare/sector/:name/stocks
GET /api/akshare/stock/:code/fund-flow
GET /api/akshare/events/earnings
```

## 验收标准

- AKShare 服务启动后，`/api/data-sources` 能显示 `akshare: online`。
- 概念资金流能返回概念名称、净额、涨跌幅、公司家数和领涨股。
- 行业个股资金流能返回代码、名称、涨跌幅、主力净流入和净占比。
- AKShare 服务关闭时，现有首页仍可通过东方财富代理和演示数据运行。
- 前端能显示当前数据源来自 AKShare 或东方财富。

## 测试计划

- Unit：AKShare 字段标准化、金额单位转换、空值处理。
- Integration：AKShare 服务接口、Node 代理接口、降级逻辑。
- E2E：首页加载、切换数据源、查看概念资金、查看板块个股。

## 后续扩展

- 财务摘要和财务指标进入公司画像。
- 业绩预告、业绩快报、业绩报告进入事件流。
- 概念资金和产业链节点建立映射。
- 用户笔记关联数据快照，支持未来复盘。

