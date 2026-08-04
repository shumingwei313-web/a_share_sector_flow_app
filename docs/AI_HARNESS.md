# AI Harness

## 设计目标

AI Harness 的目标是让 AI 成为可靠研究助手，而不是随口生成观点的聊天框。

## Agent 分工

| Agent | 职责 | 输入 | 输出 |
| --- | --- | --- | --- |
| Event Agent | 收集和清洗事件 | 新闻、公告、财报、用户输入 | 标准化事件 |
| Chain Agent | 产业链传导 | 事件、行业、公司 | 上下游影响路径 |
| Company Agent | 公司受益分析 | 公司资料、财务、公告 | 公司影响摘要 |
| Expectation Agent | 预期差分析 | 市场表现、资金、人气、事件 | 预期差候选 |
| Note Agent | 研究笔记 | 用户输入、证据、AI 摘要 | 结构化研究记录 |
| Review Agent | 复盘验证 | 历史笔记、后续数据 | 判断质量复盘 |
| Report Agent | 报告生成 | 所有结构化结果 | 日报、主题报告 |

## 产品入口位置

AI Agent 不应该只作为右上角聊天框存在。它在产品里分两类入口：

| 入口 | 出现位置 | 使用方式 | 适合任务 |
| --- | --- | --- | --- |
| 全局 Agent | 顶部 `询问 AI` | 用户临时提问，带当前页面上下文 | 快速解释、搜索帮助、问某个板块怎么看 |
| 流程 Agent | 研究闭环各模块内部 | 用户选中具体事件、板块、公司或笔记后触发 | 捕捉清洗、产业链连接、预期差比较、判断生成、笔记结构化、复盘 |

推荐产品形态：

```text
Capture 捕捉
  AI 整理证据：把新闻、公告、财报、电话会议、研报观点和行情异动统一成 CaptureItem。

Connect 连接
  AI 生成影响路径：事件 -> 行业 -> 产业链节点 -> 上下游 -> 公司。

Compare 比较
  AI 比较预期差：基本面证据、市场反应、资金流、人气是否一致。

Conclude 判断
  AI 草拟研究假设：结论、依据、不确定性、反证、待验证问题。

Commit 记录
  AI 结构化笔记：把用户观点保存成可复盘字段。

Check 复盘
  AI 复盘提醒：对比当时判断和后续数据，提示需要修正的地方。
```

因此，顶部 `询问 AI` 是入口，不是核心产品。核心产品是每个研究步骤里都有一个明确的 AI 动作按钮，并且每次调用都带上当前对象、证据和用户意图。

## Skills

Skills 是研究方法，不是数据接口。

```text
event_impact_analysis
industry_chain_mapping
company_benefit_assessment
expectation_gap_detection
evidence_weighting
decision_note_structuring
research_report_writing
review_and_feedback
```

## MCP Tools

MCP Tools 是可调用工具。

```text
search_public_events
get_market_overview
get_sector_ranking
get_sector_flow
get_company_profile
get_company_announcements
get_financial_reports
get_supply_chain_nodes
save_research_note
search_research_memory
generate_daily_brief
```

## 输出约束

所有 AI 输出必须包含：

- 结论。
- 依据。
- 不确定性。
- 待验证问题。
- 风险提示。

禁止输出：

- 确定收益承诺。
- 直接买卖指令。
- 没有来源的事实判断。
- 用情绪热度冒充基本面验证。

## Prompt 骨架

```text
你是个人投研助手。你的任务不是给投资建议，而是帮助用户整理公开信息、建立研究链路并保存可复盘判断。

请按以下结构输出：
1. 发生了什么
2. 可能影响的行业
3. 产业链传导路径
4. 相关公司与受益逻辑
5. 市场是否已经反应
6. 证据强弱
7. 待验证问题
8. 风险提示
9. 适合保存到研究笔记的结论
```
