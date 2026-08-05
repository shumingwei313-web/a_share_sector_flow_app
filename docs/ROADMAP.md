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
- 建立 AI 调用基本链路：
  - `User Goal -> Planner -> Tool Calling -> Memory Retrieval -> LLM -> Human Review`。
  - 所有 AI 输出必须带来源、证据等级、不确定性和待验证问题。
- 新增服务端 `Ask AI` 接口，前端不保存模型 API Key。
- 记录 token、延迟、工具调用、fallback 和用户采纳/修改行为。

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
- 前端不直接调用 MCP；MCP 只存在于后端 provider、Agent 或定时任务层。
- 为每个 MCP tool 定义：
  - 输入 schema。
  - 输出 schema。
  - 超时策略。
  - 缓存策略。
  - 降级 fallback。
  - 评测样例。

## Phase 4: 资料库与记忆

- 接入新闻、公告、研报摘要和用户笔记。
- 建立 RAG 检索。
- 形成个人投资记忆：
  - 曾经关注过什么。
  - 当时为什么关注。
  - 后来结果如何。
  - 哪些判断模式经常有效或失效。
- 明确 RAG 优先于微调：
  - 新闻、公告、财报和电话会议高频变化，必须保留来源。
  - 微调只用于后期报告风格稳定化或小模型字段抽取。
- 建立 Evidence Store：
  - 保存原文链接、摘要、结构化字段、来源、时间和证据等级。
- 建立 User Memory：
  - 保存用户确认后的研究笔记、关注理由、假设、反证和复盘结果。

## Phase 5: 多 Agent

- Market Agent：市场情绪和风险偏好。
- Sector Agent：板块轮动和强弱。
- Stock Agent：个股画像和异动解释。
- Risk Agent：风险提示和仓位提醒。
- Report Agent：把证据、图表、观点整理成报告。
- Orchestrator Agent：识别用户意图，决定进入 Capture、Connect、Compare、Conclude、Commit、Check 哪个阶段。
- 每个 Agent 都要具备：
  - 明确输入。
  - 明确输出 schema。
  - 可调用工具白名单。
  - 失败降级方式。
  - 可观测日志。
  - 评测样本。

## Phase 6: AI 评测与产品化运营

- 建立 Golden Set：
  - 新闻、公告、财报、电话会议、研报观点、行情异动、用户笔记。
- 离线评测：
  - 信息抽取准确率。
  - 证据追溯率。
  - 产业链路径合理率。
  - schema 通过率。
  - 风险边界合规率。
- 在线评测：
  - 用户保存率。
  - 用户修改率。
  - 用户拒绝率。
  - 用户继续追问率。
  - 用户回到复盘率。
- 建立 AI 成本看板：
  - token 消耗。
  - 单次请求成本。
  - 平均延迟。
  - fallback 触发率。
  - 工具失败率。
