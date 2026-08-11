# 情绪之道项目介绍

## 一句话定位

情绪之道是一个面向个人投资研究者的 AI 研究工作台。

它不提供买卖建议，也不替用户做投资决策，而是帮助用户把每天分散的行情、资金、新闻、公告、财报、电话会议和个人判断，沉淀成一条可追踪、可验证、可复盘的研究链。

## 为什么做这个产品

传统行情软件更擅长回答：

```text
今天什么涨了？
哪个板块最热？
哪只股票人气最高？
```

但真正的投研过程关心的是：

```text
今天发生了什么？
它影响哪些行业？
上下游之间如何传导？
哪些企业真正受益？
哪些只是短期市场情绪？
几个月后还能不能回看当初为什么关注它？
```

很多个人投资者的问题不是没有信息，而是信息太分散：

- 新闻、公告、财报、电话会议、研报观点分散在不同平台。
- 行情、资金、人气和基本面证据没有被放到同一个研究上下文里。
- 研究过程容易丢失，只记得最后结论，忘记当初判断依据。
- 回看时很难判断自己当时是基于证据，还是被市场情绪带动。

因此，情绪之道的核心目标不是追逐股价，而是记录和管理投资研究逻辑。

## Target User

第一阶段服务对象是个人投资研究者，尤其是：

- 关注 A 股板块轮动和产业链机会的个人投资者。
- 希望建立自己研究体系，而不是只看热榜和短线消息的用户。
- 会阅读新闻、公告、财报、研报，但缺少统一整理工具的用户。
- 希望复盘自己判断质量、逐步形成投资方法论的用户。

当前不是面向高频交易，也不是面向机构投研协作平台。

## 产品定位

情绪之道的定位是：

```text
个人投资研究操作系统
```

它介于传统行情软件、信息聚合工具和 AI 助手之间：

```text
行情软件
  提供价格、资金、热度和榜单。

信息平台
  提供新闻、公告、财报、研报和电话会议。

AI 助手
  帮用户整理证据、生成研究假设、提示不确定性和待验证问题。

情绪之道
  把三者连接成可复盘的研究闭环。
```

## 产品 Benchmark

项目主要参考两个方向。

### Investment OS

Investment OS 的启发是：优秀投研产品不是简单行情看板，而是研究操作系统。

它强调：

```text
事件
-> 行业影响
-> 产业链传导
-> 公司受益或受损
-> 市场预期是否充分
-> 证据是否支持
-> 形成研究记录
-> 未来复盘验证
```

情绪之道借鉴的是这种研究链路，而不是简单复制 UI。

### research-agent

research-agent 的启发是：AI 不应该只是一个聊天框，而应该拆成有明确职责边界的 Agent。

情绪之道后续会把 AI 拆成：

- Event Agent：整理事件和信息源。
- Chain Agent：梳理产业链传导。
- Company Agent：分析公司影响。
- Expectation Agent：识别预期差。
- Note Agent：结构化研究笔记。
- Review Agent：复盘历史判断。
- Report Agent：生成日报或主题报告。

## 研究闭环

情绪之道把投研流程抽象成六步：

```text
Capture 捕捉
  收集新闻、公告、财报、电话会议、研报观点和行情异动。

Connect 连接
  把事件连接到行业、产业链、上下游和相关公司。

Compare 比较
  比较资金、人气、价格、基本面证据是否一致。

Conclude 判断
  形成研究假设，同时保留不确定性和反证。

Commit 记录
  把判断保存成研究笔记。

Check 复盘
  后续回看当初判断是否成立。
```

左侧导航不是普通页面入口，而是这条研究流程的导航。

## 架构设计

项目采用 DDD + Clean Architecture 的混合架构。

核心分层：

```text
domain
  金融投研领域模型和纯规则。

application
  用例编排，例如获取捕捉信息流、运行研究 Agent、生成 Evidence Pack。

infrastructure
  外部数据源、缓存、数据库、模型调用和 MCP 适配。

interfaces
  HTTP API、Web UI、未来 MCP tools。
```

整体数据流：

```text
Web UI
-> HTTP API
-> Application Use Case
-> Data Provider
-> External Data / Cache / LLM
-> Domain Normalization
-> Evidence Pack
-> Research Output
-> Web UI
```

这样设计的原因是：

- 前端不直接依赖东方财富、AKShare、DeepSeek 或 MCP。
- 数据源可以替换，页面结构不需要推翻。
- AI 模型可以替换，研究流程不受影响。
- 领域规则可以被测试，不被 UI 和外部接口污染。

## 数据源与工具

当前项目的数据源分为三类。

### 东方财富公开数据

用于展示阶段的：

- 主要市场指数。
- 板块热度。
- 板块资金曲线。
- 热股榜。
- 个股详情。

### AKShare

作为后续更完整的 A 股研究数据源，计划覆盖：

- 财报。
- 公告。
- 行情异动。
- 行业和概念数据。
- 资金流。
- 财务指标。

### MCP / 外部数据工具

后续会把 MCP 工具封装到 infrastructure 层：

- `mcp-aktools`：用于 A 股板块、公告、财报、行情异动等信息流。
- `financial-datasets/mcp-server`：用于美股新闻、财报、电话会议和产业链线索。
- `stock-sdk`：用于行情、热榜和基础市场数据补充。

前端不会直接调用 MCP，而是通过后端 use case 和 provider 统一适配。

## RAG 在项目中的作用

RAG 不是一个单独页面，而是 AI Agent 每次回答前的证据准备过程。

当前链路：

```text
用户问题
-> 当前页面上下文
-> Capture 信息流
-> 市场数据
-> 热股榜
-> 关键词 / 实体召回
-> 证据排序
-> Evidence Pack
-> LLM 结构化回答
```

Evidence Pack 中每条证据包含：

```text
title
source
type
summary
companies
sectors
concepts
evidenceLevel
confidence
```

AI 回答必须基于 Evidence Pack，而不是凭空生成。

回答结构固定为：

```text
结论
依据
不确定性
待验证问题
风险提示
```

这让 AI 从普通聊天框变成一个有证据约束的研究助手。

## AI Harness

AI Harness 的目标是让 AI 可控、可观测、可降级。

它包含四个核心要素：

```text
LLM
  DeepSeek / OpenAI-compatible 模型，用于结构化分析。

Tools
  市场数据、捕捉信息流、热股榜、公司资料、研究笔记等工具。

Memory
  用户保存的研究笔记、证据记录和复盘结果。

Planning
  根据用户所在模块，决定做事件整理、产业链推理、预期差判断还是笔记沉淀。
```

当前已经具备：

- DeepSeek 服务端调用链路。
- RAG 证据检索。
- Evidence Pack 展示。
- token 估算。
- 工具调用记录。
- 模型不可用时的降级输出。
- 将 AI 输出保存到研究链。

API Key 只配置在 Vercel 或本地 `.env.local`，不会进入浏览器或 GitHub。

## 开发 Harness

项目不是一次性页面 demo，而是按工程化方式推进。

### SDD

每个重要功能先写规格：

```text
用户场景
输入输出
验收标准
数据需求
风险边界
测试计划
```

### TDD

核心逻辑要写测试，例如：

- CaptureItem 标准化。
- RAG 关键词召回。
- Agent dry-run 降级。
- DeepSeek 调用路径。
- provider 合并和降级。

### 质量检查

当前检查命令：

```bash
node scripts/quality-check.mjs
node --test tests/**/*.test.js
```

检查内容包括：

- 关键文件是否存在。
- `server.js` 和 `app.js` 语法。
- 单元与集成测试。
- 架构依赖护栏。
- 文档上下文是否完整。

### 架构护栏

关键约束：

- `domain` 不能依赖 HTTP、DOM、fetch、数据库或模型 API。
- `application` 只能通过 provider 接口使用外部能力。
- `infrastructure` 负责适配东方财富、AKShare、MCP 和 LLM。
- `interfaces/http` 只负责请求响应，不放复杂研究判断。
- AI 输出必须包含风险提示，不得输出确定收益承诺或直接买卖指令。

## 当前完成状态

已经完成：

- 总览页：主要市场、板块热度、资金曲线、热股榜、概念筛选、公司详情。
- 捕捉模块：承接行情异动、新闻、公告、财报、电话会议、研报观点。
- 研究闭环导航：总览、捕捉、连接、比较、判断、记录、复盘、研究日报。
- AI Agent：RAG 检索、Evidence Pack、DeepSeek 接入、降级输出、token 记录。
- 部署：Vercel 在线展示。
- 工程化：docs、specs、tests、quality-check、architecture-check。

## 下一阶段路线图

下一阶段重点不是继续堆页面，而是增强真实数据和研究链深度。

```text
1. 接入 AKShare 服务化数据源
2. 建立 Evidence Store 持久化证据库
3. 将关键词 RAG 升级为 Hybrid Search
4. 将全局 AI 拆成流程内 Agent
5. 增加研究笔记、反证字段和复盘提醒
6. 建立 Agent 输出评测体系
7. 增加数据缓存和定时更新机制
```

## 对外讲解 30 秒版本

情绪之道是一个个人投研研究工作台。它解决的问题不是告诉用户买什么，而是帮用户把市场事件、产业链传导、公司影响、证据和个人判断沉淀成可复盘的研究链。架构上采用 DDD + Clean Architecture，把前端、用例、领域模型、数据源和 AI 模型解耦。AI 部分不是简单聊天框，而是通过 RAG 先构建 Evidence Pack，再由 DeepSeek 生成带依据、不确定性和风险提示的结构化回答。整个项目也有 SDD、TDD、质量检查和架构护栏，目标是从 demo 逐步演进成真正可用的个人研究操作系统。

