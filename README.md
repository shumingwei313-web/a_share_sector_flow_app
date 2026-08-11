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
