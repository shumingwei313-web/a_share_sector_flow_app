# 产品路线图

## Phase 0: 当前 MVP

- 本地网页运行。
- 东方财富公开行情代理。
- 板块热度、资金曲线、大盘走势。
- 板块内个股和热门概念联动。
- 热股榜和 AI 辅助结论。

## Phase 1: 个人投研工作台

- 接入 AKShare 数据服务，补齐行业资金、概念资金、个股资金和业绩事件。
- 新增个人关注列表。
- 新增观察笔记：记录为什么关注某个板块、概念或个股。
- 新增本地存储：保存关注、笔记、报告和复盘。
- 新增一键报告：市场日报、板块观察、个股观察。
- 新增导出：Markdown / HTML / PDF。
- 新增今日事件：把新闻、公告、财报、异动聚合到研究入口。
- 新增事件详情：展示影响行业、相关产业链节点、相关公司和证据等级。

## Phase 2: Research Shell

- 新增自然语言输入框。
- 支持问题：
  - 今天资金最强的板块是什么？
  - 机器人板块里哪个概念最热？
  - 今天发生了什么，影响哪些行业？
  - 这个事件会沿着哪些上下游传导？
  - 哪些公司是真受益，哪些只是情绪？
  - 帮我比较两个板块的资金持续性。
  - 为我的关注列表生成今日风险提示。
- 先用后端规则和模板实现，后续接 LLM。

## Phase 3: MCP 工具层

- 把核心 API 暴露为 MCP tools：
  - `get_market_overview`
  - `get_sector_ranking`
  - `get_sector_flow`
  - `get_sector_concepts`
  - `get_concept_stocks`
  - `get_hot_stocks`
  - `search_events`
  - `map_supply_chain`
  - `rank_expectation_gaps`
  - `get_watchlist`
  - `save_decision_note`
  - `generate_research_report`
- 让桌面 AI 助手可以直接调用你的平台数据。

## Phase 4: 资料库与记忆

- 接入新闻、公告、研报摘要和用户笔记。
- 建立 RAG 检索。
- 形成个人投资记忆：
  - 曾经关注过什么。
  - 当时为什么关注。
  - 后来结果如何。
  - 哪些判断模式经常有效或失效。

## Phase 5: 多 Agent

- Market Agent：市场情绪和风险偏好。
- Sector Agent：板块轮动和强弱。
- Stock Agent：个股画像和异动解释。
- Risk Agent：风险提示和仓位提醒。
- Report Agent：把证据、图表、观点整理成报告。
