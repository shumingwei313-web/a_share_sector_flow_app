# AI Product and Agent Strategy

这份文档用于把“情绪之道”的 AI 能力讲清楚：它不是一个套壳聊天框，而是一个围绕个人研究闭环构建的金融研究 Agent 产品。

## 1. 基本链路：LLM + 工具调用 + 记忆 + 规划

情绪之道的 AI 链路采用四要素：

```text
User Goal
-> Planner 规划任务
-> Tool Calling 调用数据/检索/保存工具
-> Memory 检索个人研究记忆和证据库
-> LLM Reasoning 生成结构化判断
-> Human Review 用户确认、修改、保存
```

### LLM 的职责

LLM 不直接替用户做投资决策，而是把原始信息变成可复盘的研究结构：

- 发生了什么。
- 影响哪些行业和产业链节点。
- 哪些公司相关，受益或受损逻辑是什么。
- 市场是否已经反应。
- 证据强弱、反证和待验证问题。
- 适合保存到研究笔记的结构化内容。

### 工具调用 Function Calling

工具调用负责取数和执行受控动作。LLM 只决定“该调用什么工具”和“如何解释结果”，不直接访问数据库或外部接口。

核心工具包括：

| 工具 | 作用 | 所在层 |
| --- | --- | --- |
| `get_market_overview` | 获取主要指数和市场概况 | application / infrastructure |
| `get_sector_ranking` | 获取板块热度、资金、涨跌幅 | application / infrastructure |
| `get_concept_stocks` | 查询概念交集个股 | application |
| `get_company_profile` | 获取公司市值、PE、换手率、K线等 | application / infrastructure |
| `search_capture_items` | 检索新闻、公告、财报、电话会议、研报观点、行情异动 | application |
| `search_research_memory` | 检索用户过去的笔记和判断 | application |
| `save_research_note` | 保存用户确认后的研究笔记 | application |
| `generate_research_report` | 生成日报、主题报告、公司观察 | application |

### 记忆 Memory

记忆分成两类：

| 类型 | 内容 | 用途 |
| --- | --- | --- |
| Evidence Memory | 新闻、公告、财报、电话会议、研报观点、行情异动、行情数据 | 支撑事实与证据追溯 |
| User Memory | 用户关注列表、研究笔记、历史判断、复盘结果 | 保留个人研究过程 |

AI 输出必须能追溯到 Evidence Memory 或 User Memory。没有来源的事实判断不能进入报告。

### 规划 Planning

规划不是让 Agent 自由发挥，而是把研究闭环拆成固定阶段：

```text
Capture 捕捉
-> Connect 连接
-> Compare 比较
-> Conclude 判断
-> Commit 记录
-> Check 复盘
```

每一步只允许调用与该阶段相关的工具。例如 Capture 阶段只能收集和清洗信息，不能直接输出买卖建议。

## 2. RAG、微调、上下文窗口、成本和延迟取舍

### RAG vs 微调

情绪之道优先采用 RAG，而不是先做微调。

| 方案 | 适合场景 | 在本项目中的判断 |
| --- | --- | --- |
| RAG | 资料经常更新、需要引用来源、用户笔记持续增长 | 优先使用。新闻、公告、财报、电话会议和研究笔记都适合 RAG |
| 微调 | 输出格式稳定、领域表达风格固定、需要提升小模型特定任务表现 | 后置使用。等结构化报告样本足够后，再考虑报告风格微调 |

原因：

- 金融资料更新频繁，微调无法及时吸收最新事实。
- 用户最需要的是“可追溯证据”，RAG 更容易保留来源。
- 当前阶段样本不足，微调容易变成昂贵但不稳定的工程。

### 上下文窗口 Tradeoff

不能把所有资料都塞进上下文窗口。设计原则：

```text
短上下文：当前页面状态、用户问题、已选板块/公司。
中上下文：最近捕捉的相关事件、当前研究主题证据。
长记忆：历史笔记、财报、电话会议、研报摘要，通过 RAG 检索进入。
```

取舍逻辑：

- 上下文越长，成本越高、延迟越高、注意力越容易分散。
- 对话中只放“当前任务必需信息”。
- 历史资料先检索、排序、摘要，再放入 LLM。

### 成本和延迟控制

| 阶段 | 模型策略 | 原因 |
| --- | --- | --- |
| 搜索提示、字段抽取 | 小模型 / 规则优先 | 高频、低风险、要快 |
| Capture 清洗 | 小模型 + schema 校验 | 信息整理，不需要最强推理 |
| Connect / Compare | 中高能力模型 | 需要产业链和证据关系推理 |
| Conclude / Report | 高能力模型 | 需要表达、结构和风险边界 |
| 复盘批处理 | 异步任务 | 可延迟，不阻塞用户 |

前端展示优先读缓存。AI 调用在服务端执行，记录 token、延迟、工具调用、失败原因和降级路径。

## 3. MCP、多 Agent 编排、可观测性和降级

### MCP 的位置

MCP 是工具协议，不是前端数据源。浏览器不直接调用 MCP。

```text
Web UI
-> API Gateway
-> Application Use Case
-> Provider Interface
-> MCP Tool / AKShare / stock-sdk / Database
```

这样做的原因：

- 前端不暴露密钥。
- 可以统一缓存和降级。
- 可以把 MCP、HTTP API、数据库都适配成同一个 provider。
- 便于测试和架构护栏。

### 多 Agent 编排

情绪之道采用“主 Agent 编排 + 专家 Agent 执行”的方式。

| Agent | 所属研究阶段 | 主要任务 | 输出 |
| --- | --- | --- | --- |
| Orchestrator Agent | 全局 | 理解用户目标、拆任务、选择工具和子 Agent | Task Plan |
| Capture Agent | Capture | 清洗新闻、公告、财报、电话会议、研报观点、行情异动 | CaptureItem |
| Chain Agent | Connect | 事件到行业、产业链、上下游、公司映射 | ImpactPath |
| Compare Agent | Compare | 比较基本面、市场反应、资金、人气和预期 | ExpectationGap |
| Thesis Agent | Conclude | 生成研究假设、反证、待验证问题 | Hypothesis |
| Memory Agent | Commit | 保存用户确认后的笔记和证据链接 | DecisionNote |
| Review Agent | Check | 对历史判断做后验复盘 | Review |
| Report Agent | Report | 生成日报、主题报告、公司观察 | Report |

编排规则：

```text
1. Orchestrator 先判断任务属于研究闭环哪一步。
2. 只调用该阶段允许的工具和 Agent。
3. 子 Agent 输出必须符合 schema。
4. Orchestrator 汇总结果，标记证据、置信度和风险。
5. 用户确认后才保存为个人研究记忆。
```

### 可观测性 Observability

每次 AI 调用都记录：

| 字段 | 用途 |
| --- | --- |
| `traceId` | 串联一次用户请求 |
| `userIntent` | 用户想完成什么 |
| `selectedContext` | 当前板块、公司、事件、笔记 |
| `retrievedEvidence` | RAG 检索到的证据 |
| `toolCalls` | 调用了哪些工具、参数、耗时、成功/失败 |
| `model` | 使用的模型 |
| `inputTokens` / `outputTokens` | 成本计量 |
| `latencyMs` | 延迟监控 |
| `fallbackUsed` | 是否降级 |
| `humanAction` | 用户采纳、修改、拒绝、保存 |

这些日志不只是技术排错，也用于 PM 评估：哪些入口真的有用、哪些 Agent 经常失败、哪些输出被用户修改最多。

### 降级 Fallback

降级策略分四层：

| 失败点 | 降级方式 |
| --- | --- |
| 实时数据失败 | 读缓存数据 |
| 缓存为空 | 读 demo fallback，明确标记演示/降级 |
| LLM 调用失败 | 返回结构化模板，让用户手动记录 |
| RAG 检索不足 | 明确提示证据不足，只生成待验证问题 |

产品原则：宁可少说，也不编造。AI 不确定时必须展示“不确定性”和“待验证问题”。

## 4. 评测设计

情绪之道的评测不是只看“回答像不像”，而是围绕研究工作流评估。

### 离线评测

| 维度 | 指标 | 样例 |
| --- | --- | --- |
| 信息抽取 | 字段完整率、类型识别准确率 | 新闻能否转成 CaptureItem |
| 证据追溯 | 引用命中率、无来源判断率 | 结论是否能对应公告/财报/新闻 |
| 产业链推理 | 影响路径合理率 | 事件是否正确映射到上游/下游/公司 |
| 预期差判断 | 市场反应与基本面比较是否完整 | 是否同时考虑资金、涨幅、业绩和人气 |
| 风险边界 | 是否避免买卖指令 | 不输出确定收益和操作建议 |
| 格式稳定 | schema 通过率 | 输出能否被前端直接渲染 |

### 在线评测

| 用户行为 | 产品含义 |
| --- | --- |
| 用户保存 AI 输出 | 输出有研究价值 |
| 用户大幅修改 | 结构有用但质量不足 |
| 用户拒绝/关闭 | 入口或内容不匹配 |
| 用户继续追问 | 有探索价值 |
| 用户回到复盘 | 记忆和研究链路产生长期价值 |

### Golden Set

建立一组固定评测样本：

- 10 条新闻。
- 10 条公告。
- 10 份财报/业绩预告。
- 10 条电话会议摘要。
- 10 条研报观点。
- 10 个行情异动案例。
- 10 份用户历史研究笔记。

每条样本人工标注：

- 应影响哪些行业。
- 对应产业链节点。
- 相关公司。
- 证据等级。
- 不确定性。
- 不应该输出的错误结论。

## 5. PM 表达：先全景后细节

面试或汇报时可以这样讲：

```text
这个项目不是做一个荐股工具，而是做个人投资研究的操作系统。

用户痛点是：信息源分散、研究链路断裂、当时为什么判断很容易遗忘。我的产品把研究拆成 Capture、Connect、Compare、Conclude、Commit、Check 六步，让 AI 处理重复的信息整理工作，但最终判断仍由人完成。

AI 架构上，我把它拆成 LLM、工具调用、记忆和规划四部分。LLM 负责结构化推理；工具调用负责取行情、新闻、公告、财报、电话会议和公司信息；记忆负责保存用户历史判断和证据；规划负责把任务约束在研究闭环里。

数据和工具层会通过 Clean Architecture 隔离：前端不直接调 MCP 或 AKShare，而是通过后端 use case 和 provider。这样可以做缓存、降级、评测和可观测性。

我不会一开始做微调，而是优先做 RAG，因为金融信息高频变化，并且产品要求证据可追溯。等报告样本和用户修改数据积累后，再考虑对报告风格或字段抽取做小模型微调。

多 Agent 方面，我会用 Orchestrator Agent 编排 Capture、Chain、Compare、Thesis、Memory、Review、Report 等子 Agent，每个 Agent 有明确输入输出和 schema，不允许自由发挥。

评测上，我会建立 Golden Set，评估信息抽取、证据追溯、产业链路径、风险边界、schema 稳定性，以及线上用户是否保存、修改或拒绝 AI 输出。
```

## 6. 我的项目护城河

这个项目的护城河不是“我也接了一个大模型”，而是：

- 金融研究工作流理解：从事件到产业链、公司、预期差、复盘。
- 产品结构化能力：把模糊研究过程拆成可交互、可评测、可保存的闭环。
- AI 落地意识：RAG、工具调用、MCP、缓存、降级、可观测性和评测都服务产品目标。
- Human in the Loop：AI 只做整理、推理辅助和记录，用户保留最终判断权。
- 长期记忆：真正有价值的是用户自己的判断过程和复盘资产。

## 7. 下一步落地优先级

| 优先级 | 任务 | 目标 |
| --- | --- | --- |
| P0 | 建立 AI 调用 trace schema | 先让每次 AI 调用可观测 |
| P0 | 设计 `Ask AI` 服务端接口 | 避免前端暴露模型密钥 |
| P0 | Capture Agent 输出 schema | 把新闻、公告、财报统一成 CaptureItem |
| P1 | RAG Evidence Store | 支持证据检索和来源追溯 |
| P1 | 研究笔记 Memory | 保存用户确认后的判断 |
| P1 | Agent Eval Golden Set | 建立可重复评测 |
| P2 | 多 Agent 编排 | 从单 Agent 过渡到流程 Agent |
| P2 | Token 成本看板 | 让 AI 使用成本可控 |
| P3 | 报告风格微调 | 样本充足后再做 |
