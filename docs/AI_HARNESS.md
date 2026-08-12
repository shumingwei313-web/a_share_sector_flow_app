# AI Harness

## 设计目标

AI Harness 的目标是让 AI 成为可靠研究助手，而不是随口生成观点的聊天框。

更完整的 AI 产品与 Agent 设计见 `docs/AI_PRODUCT_AGENT_STRATEGY.md`。那里定义了 LLM + 工具调用 + 记忆 + 规划的基本链路、RAG 和微调取舍、MCP 位置、多 Agent 编排、可观测性、降级和评测方案。

## Agent 分工

当前阶段采用“主 Agent 编排 + 专家 Agent 执行”的产品形态。主 Agent 负责理解用户目标、选择研究闭环阶段和调用工具；专家 Agent 负责各自阶段的结构化输出。

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

## 当前落地形态

当前版本已经把流程 Agent 接入到左侧研究闭环模块，并在模块内部增加了 `AI HARNESS` 面板。它不是普通聊天框，而是把研究闭环拆成 6 个可触发的 AI 动作：

| 闭环步骤 | 按钮 | Agent 组合 | 输入上下文 | 目标输出 |
| --- | --- | --- | --- | --- |
| 捕捉 | AI 整理捕捉 | Collector + Retriever | 捕捉信息流、当前板块、热门概念、热股榜 | 结构化证据清单 |
| 资料库 | AI 检索证据 | Retriever + Memory | EvidenceRecord、来源、公司、板块、用户问题 | 可引用 Evidence Pack |
| 比较 | AI 比较预期差 | Retriever + Analyst + Critic | 基本面证据、市场反应、资金、人气、反证 | 真实影响 / 情绪噪音判别 |
| 判断 | AI 生成假设 | Planner + Analyst + Critic | 证据包、资金、人气、产业链、反证 | 研究假设与待验证问题 |
| 记录 | AI 结构化笔记 | Writer + Memory | 研究对象、证据、个人判断、置信度 | 可复盘研究笔记 |
| 复盘 | AI 生成复盘清单 | Critic + Memory | 历史笔记、后续行情、证伪信号 | 复盘问题与修正项 |
| 研究日报 | AI 生成日报 | Writer + Memory | 今日市场、证据缺口、研究链、复盘记录 | 个人研究日报草稿 |

产品层的按钮只负责组织意图和上下文，模型调用统一走 `/api/agent/query`。这样可以保持 Clean Architecture 的边界：前端表达研究任务，Application 层执行 RAG、工具调用、模型调用、降级和可观测性记录。

后端 `runResearchAgent` 会根据 `workflowStep` 注入阶段约束。这样即使前端按钮文案变化，模型也会知道当前是 Capture、Connect、Compare、Conclude、Commit、Check 里的哪一步，并按对应输出格式回答。

## 模型供应商

模型只是一层可替换 provider，研究方法不绑定某个模型。

```text
前端 AI 动作
-> /api/agent/query
-> Application: runResearchAgent
-> RAG: retrieveResearchEvidence
-> Provider Adapter: OpenAI-compatible Chat Completions
-> DeepSeek API 或 OpenAI GPT-4o 等模型
-> 可观测性、Token 估算、降级输出
```

推荐环境变量：

```text
AI_PROVIDER=deepseek
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=实际使用的 DeepSeek 模型名
DEEPSEEK_API_KEY=...

# 或者使用 OpenAI-compatible 配置
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o
OPENAI_API_KEY=...
```

上线到 Vercel 时，API Key 只放在 Vercel Environment Variables，不写入 GitHub。

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

## RAG 在情绪之道里的用法

RAG 不是独立功能，而是 AI Agent 每次回答前的证据准备过程。

当前第一版采用轻量 RAG：

```text
用户问题
-> 当前页面上下文：选中板块、概念、热股、市场状态
-> Capture 信息流：新闻、公告、财报、电话会议、研报观点、行情异动
-> Market 数据：板块热度、资金净流入、涨跌幅、热股榜
-> 关键词/实体召回
-> 证据排序
-> Evidence Pack
-> LLM 结构化回答
```

为什么先这样做：

- 展示阶段不需要马上上向量数据库，也能解释 RAG 链路。
- 当前数据结构已经有 `CaptureItem`、板块、概念、个股和热股榜。
- 轻量检索更容易测试，也更容易观察失败原因。

后续升级路径：

```text
轻量关键词检索
-> Evidence Store 持久化
-> Embedding 向量检索
-> Hybrid Search：关键词 + 向量 + 时间衰减 + 证据等级
-> 用户研究记忆召回
```

RAG 输出给模型的 Evidence Pack 必须包含：

- `title`：证据标题。
- `source`：来源。
- `type`：新闻、公告、财报、电话会议、研报观点、行情异动、板块行情或热股榜。
- `summary`：摘要。
- `companies`：相关公司。
- `sectors`：相关板块。
- `concepts`：相关概念。
- `evidenceLevel`：证据等级。
- `confidence`：系统置信度。

AI 回答时必须引用 Evidence Pack，而不是凭空生成。

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
