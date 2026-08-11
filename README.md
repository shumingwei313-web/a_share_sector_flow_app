# 情绪之道 · Personal Research OS

情绪之道是一个面向个人投资研究的市场情绪与证据链工作台。它聚合板块资金、热门概念、个股线索、事件、公告、财报和研究记录，帮助研究者把每日观察沉淀为可复盘的研究资产。

> 本项目只用于研究辅助与产品原型展示，不提供投资建议，不替代独立判断。

## 在线访问

```text
https://a-share-sector-flow-app.vercel.app/
```

## 产品定位

个人投资研究中最容易丢失的不是结论，而是结论形成前的过程：当天发生了什么、影响哪些行业、产业链如何传导、哪些公司真正受益、哪些只是短期情绪。情绪之道的目标是把这些分散信息组织成一条可追踪、可验证、可复盘的研究链。

## 核心能力

- 市场总览：展示 A 股核心指数、板块热度、资金净流入曲线、热门概念与热股线索。
- 事件捕捉：沉淀新闻、公告、财报、电话会议、研报观点和行情异动。
- 资料库：按公司、行业、主题和来源保存证据，保留时间戳与来源层级。
- 研究链：把事件、证据、假设、反证、判断和复盘结果串联起来。
- 研究日报：将每日重要变化整理成适合回顾的结构化记录。
- 风险边界：区分事实、推断和观点，保留数据来源和不确定性说明。

## 研究闭环

```text
捕捉 Capture
  -> 连接 Connect
  -> 比较 Compare
  -> 判断 Conclude
  -> 记录 Record
  -> 复盘 Review
```

每一步都保留原始证据和用户判断，避免只留下无法追溯的最终结论。

## 架构设计

项目采用 DDD + Clean Architecture 的混合架构。当前仍保持轻量 MVP 形态，但核心边界已经按可扩展系统设计：

```text
domain
  金融投研领域模型和纯规则，例如 CaptureItem、Evidence、Sector、Stock、ResearchNote。

application
  用例编排，例如获取捕捉信息流、检索研究证据、运行研究 Agent、生成 Evidence Pack。

infrastructure
  外部数据源、缓存、数据库、模型调用和 MCP 适配，例如 Eastmoney、AKShare、DeepSeek、stock-sdk。

interfaces
  Web UI、HTTP API、Vercel API Routes、EdgeOne Functions，后续可扩展 MCP tools。
```

核心原则：

- 前端不直接依赖东方财富、AKShare、DeepSeek 或 MCP。
- 数据源通过 provider 适配后统一进入应用层。
- AI 模型只通过服务端接口调用，API Key 不进入浏览器。
- 领域规则优先放在 `domain` 或 `application`，便于测试和复用。
- 外部数据必须保留来源、时间、证据等级和降级状态。

## 整体数据流

```text
User Browser
  -> Web UI
  -> HTTP API / Vercel API Route
  -> Application Use Case
  -> Data Provider Router
      -> Eastmoney public endpoints
      -> AKShare Python service
      -> stock-sdk
      -> MCP adapters
      -> Demo fallback
  -> Domain Normalization
  -> Evidence Store / Cache
  -> RAG Evidence Pack
  -> LLM / Research Agent
  -> Structured Research Output
  -> Web UI / Research Note
```

这条链路的设计目标是把“行情数据”“公开资料”“用户判断”和“AI 输出”放进同一个研究上下文里，而不是让页面只展示一组临时接口返回值。

## Benchmark 与产品取舍

项目主要参考两类 benchmark：

| Benchmark | 借鉴点 | 情绪之道的取舍 |
| --- | --- | --- |
| Investment OS | 把投资研究设计成连续系统，而不是行情看板 | 保留研究链路思想，先聚焦个人投研和 A 股场景 |
| research-agent | 多 Agent 分工、工具调用、证据检索和结构化输出 | 借鉴 Agent 职责边界，但产品入口嵌入研究闭环 |
| 东方财富 / 同花顺 | 板块热度、资金流、热股榜和个股详情 | 只作为数据和交互参考，不把产品定位成交易终端 |

因此，情绪之道的重点不是“更快给出结论”，而是让用户知道结论从哪些证据、事件和判断中来。

## Agent 架构

项目借鉴多 Agent 研究流程，将研究任务拆成可观测、可回退的职责边界：

| Agent | 职责 | 输出 |
| --- | --- | --- |
| Planner | 拆解研究问题，定义证据范围和交付格式 | 研究计划、问题清单 |
| Collector | 获取行情、公告、新闻、财报、电话会议等材料 | 原始资料、来源记录 |
| Retriever | 基于资料库检索相关证据 | 证据片段、引用来源 |
| Analyst | 对事件、行业传导和公司影响进行分析 | 假设、影响路径 |
| Critic | 寻找反证、风险和缺失信息 | 风险提示、待验证项 |
| Writer | 生成日报、主题笔记和复盘记录 | 结构化研究输出 |
| Memory | 保存历史判断和复盘结果 | 可回溯研究资产 |

设计原则是“先事实、后判断；先证据、后结论；先保留过程、后生成报告”。

## RAG Harness

项目中的 RAG 不是一个独立页面，而是研究助理每次回答前的证据准备过程。

```text
用户问题
  -> 当前页面上下文
  -> Capture 信息流
  -> 市场数据
  -> 热股榜
  -> 关键词 / 实体召回
  -> 证据排序
  -> Evidence Pack
  -> DeepSeek / OpenAI-compatible 模型
  -> 结构化回答
```

Evidence Pack 保留：

- 证据标题、摘要和来源。
- 新闻、公告、财报、电话会议、研报观点、行情异动等类型。
- 相关公司、板块、概念。
- 证据等级、置信度和更新时间。

AI 输出必须包含：

- 结论。
- 依据。
- 不确定性。
- 待验证问题。
- 风险提示。

当没有配置模型 API Key 或模型调用失败时，系统会降级为 RAG dry-run，仍然展示命中的证据、工具调用状态和 token 估算，保证产品可解释、可演示、可排错。

## 数据与工具

当前版本以公开行情接口和本地缓存为展示数据源，后续计划通过 AKShare 与 MCP 工具补齐更稳定的数据服务。

```text
Frontend
  -> Node API Gateway
  -> Data Source Adapters
       -> Eastmoney public endpoints
       -> AKShare Python service
       -> MCP tools
  -> Evidence Store
  -> Agent / RAG Service
```

计划接入的数据类型：

- 行情与资金：指数、板块、概念、个股资金流向、热股排行。
- 公司资料：基本信息、市值、估值、换手率、日 K 与历史表现。
- 公开资料：公告、财报、业绩预告、新闻、电话会议、研报观点。
- 用户资料：关注列表、研究笔记、假设、复盘记录。

## 项目结构

```text
.
├── index.html                 # 前端页面
├── app.js                     # 交互、状态与数据渲染
├── styles.css                 # 视觉系统与响应式布局
├── server.js                  # 本地 Node API 网关
├── api/                       # Vercel API 入口
├── cloud-functions/           # EdgeOne Pages 函数入口
├── services/akshare_service/  # AKShare 数据服务原型
├── src/                       # Clean Architecture 分层代码
├── docs/                      # 产品、架构、数据源和研究闭环文档
├── specs/                     # SDD 规格文档
└── tests/                     # 单元与集成测试
```

## 本地运行

项目内置 Node.js 运行时，也可以使用系统 Node.js 18+。

```bash
npm start
```

然后访问：

```text
http://127.0.0.1:4173
```

如果本机没有全局 Node.js，可使用项目自带运行时：

```bash
./.runtime/node-v24.15.0-darwin-arm64/bin/node server.js
```

## 质量检查

```bash
npm run check
```

或：

```bash
./.runtime/node-v24.15.0-darwin-arm64/bin/node scripts/quality-check.mjs
./.runtime/node-v24.15.0-darwin-arm64/bin/node --test tests/**/*.test.js
```

质量检查覆盖核心文件、脚本语法、测试、架构护栏、页面引用和前端资源完整性。

## AI Harness

研究助理通过服务端接口接入 OpenAI-compatible 模型。默认没有配置 API Key 时会返回 dry-run 证据整理结果；配置模型后，会基于当前页面上下文和 RAG 证据包生成结构化研究回答。

配置方式见：

```text
docs/AI_MODEL_SETUP.md
```

## 部署

GitHub `main` 分支作为代码源。线上展示通过 Vercel 部署，国内演示可使用 EdgeOne Pages 镜像。

```text
GitHub main
  -> Vercel
  -> EdgeOne Pages
```

后端数据可采用低成本缓存方案：

```text
Scheduled Job
  -> Data Fetcher
  -> External Cache / Database
  -> Public API
  -> Frontend
```

适合 9:00、12:00、20:00 定时刷新热股榜、板块资金和事件资料，避免每次用户打开页面都实时请求上游数据。

## Roadmap

- P0：完善总览页、概念叠加、公司详情和捕捉模块展示。
- P1：接入 AKShare 数据服务，建立行情、公告、财报和新闻缓存。
- P2：建立 Evidence Store 与 RAG 检索链路，支持基于证据的问答与日报生成。
- P3：补齐多 Agent 编排、任务追踪、失败降级、工具调用日志和评测集。
- P4：形成稳定的公开展示版本与个人研究数据工作流。

## 合规说明

本项目仅用于个人研究、产品设计和技术验证。第三方行情和资讯数据需遵守对应平台、交易所和数据供应商的授权规则。正式公开运营前，需要处理数据许可、延迟声明、风险揭示、投顾合规和模型输出边界。
