# 情绪之道 MVP

这是一个已部署到公网的个人投研平台 MVP，用来验证“板块情绪 + 主力资金流向曲线 + 板块内人气热股 + 风险提示”的产品形态。线上页面优先作为产品展示入口；本地启动只用于开发和调试。

## 打开方式

公开访问：

```text
https://a-share-sector-flow-app.vercel.app/
```

## 项目展示

这个仓库同时作为我的个人项目主页。首页优先展示主项目「情绪之道」，另外两个小游戏作为独立作品入口，用来展示前端交互和视觉实现能力。

- 主项目：情绪之道，个人 A 股情绪与研究工作台。
- 其他项目：霓虹贪吃蛇，`/showcase/neon-serpent.html`。
- 其他项目：星云突击，`/showcase/nebula-strike.html`。

线上试玩：

```text
https://a-share-sector-flow-app.vercel.app/showcase/neon-serpent.html
https://a-share-sector-flow-app.vercel.app/showcase/nebula-strike.html
```

本地开发时才需要启动服务。最简单的方法：双击本目录中的 `启动网站.command`，然后访问 `http://127.0.0.1:4173`。项目已自带 Node.js 运行环境，启动后请保持终端窗口开启。

如果使用系统 Node.js，需要 Node.js 18 或更高版本。在本目录运行：

```bash
npm start
```

然后打开 `http://127.0.0.1:4173`。页面每 60 秒自动刷新，也可点击右上角刷新按钮。

## GitHub Desktop + Vercel 公开发布

这条路线让别人直接通过网址访问产品，操作门槛最低：

1. 打开 GitHub Desktop。
2. 选择 `Add Local Repository`。
3. 选择本项目文件夹：`/Users/byhkk/Documents/找工作/a_share_sector_flow_app`。
4. 点击 `Publish repository` 上传到 GitHub。
5. 打开 Vercel，选择 `Add New Project`，导入刚发布的 GitHub 仓库。
6. Framework Preset 选择 `Other` 或静态默认配置，直接 Deploy。

当前 Vercel 配置使用 `vercel.json` 作为静态公开版本。它会展示完整前端体验；如果没有后端 API，页面会自动降级为演示数据。

每次在本地改完代码后，改动不会自动同步到 GitHub。需要执行一次发布链路：

```text
GitHub Desktop -> Commit to main -> Push origin -> Vercel 自动重新部署
```

也就是说，Vercel 会自动监听 GitHub 的更新，但 Codex 在本地帮你改文件后，仍需要提交并推送到 GitHub。

真实 AKShare、AI Agent、定时任务和缓存需要单独部署后端服务，推荐使用 `docker-compose.yml`：

```text
web: Node Web/API Gateway
akshare: Python AKShare Data Service
```

详见 `docs/DEPLOYMENT.md`。

## 低成本数据更新方案

如果不想维护一直在线的服务器，可以使用 Serverless + 外部定时触发：

```text
Vercel Cron / cron-job.org
-> 调用抓取函数
-> Python AKShare 数据服务或轻量采集任务
-> 写入 Supabase / MongoDB Atlas / Redis 云缓存
-> 前端读取缓存 API
```

这个方案把“看网页”和“更新数据”拆开。用户打开网页时不实时跑 AKShare，而是读取 9:00、12:00、20:00 定时更新后的缓存结果。好处是成本低、页面响应快；代价是架构多了数据库、定时任务和数据过期状态管理。

## 项目 Harness

这个项目会按“个人投研操作系统”的方向长期演进。开工前优先阅读：

- `docs/PROJECT_CONTEXT.md`：产品目标、用户工作流和非目标。
- `docs/ARCHITECTURE.md`：DDD + Clean 的目标架构和依赖规则。
- `docs/DESIGN_SYSTEM.md`：页面骨架、亮暗主题、组件规则和 UI benchmark。
- `docs/UI_BENCHMARKS.md`：Investment OS、Figma SDS、shadcn/ui、Untitled UI、Tremor 和 TradingView 的组合参考。
- `docs/DEVELOPMENT_HARNESS.md`：SDD + TDD、测试金字塔、质量检查和架构护栏。
- `docs/AI_PRODUCT_AGENT_STRATEGY.md`：LLM + 工具调用 + 记忆 + 规划、RAG 取舍、MCP、多 Agent、可观测性、降级和评测。
- `docs/AI_HARNESS.md`：AI 在产品中的入口、Agent 分工、工具约束和输出边界。
- `docs/DATA_SOURCE_AKSHARE.md`：AKShare 数据源接入方案。
- `docs/ROADMAP.md`：从当前 MVP 到个人投研工作台、Research Shell、MCP 和多 Agent 的路线。
- `specs/0001-personal-investment-os.md`：第一阶段产品规格。

开发前先写规格，开发后运行：

```bash
npm run check
```

如果系统没有全局 `npm`，可以使用项目自带运行时执行：

```bash
./.runtime/node-v24.15.0-darwin-arm64/bin/node scripts/quality-check.mjs
```

当前检查会验证核心文件、文档入口、`server.js` 和 `app.js` 语法、单元/集成测试、架构护栏，以及页面是否引用样式、脚本和 ECharts。

## 当前数据接入

- `GET /api/market`：行业板块排名、主力净流入、涨跌幅、成交额以及前八板块分时资金曲线。
- `GET /api/sector/:code/stocks`：所选板块内个股资金排名。
- `GET /api/hot-stocks`：东方财富实时热股榜，并合并个股涨跌幅和当日主力净流入。
- 浏览器只访问本地代理，不直接调用上游接口。
- 当前使用的是东方财富公开网页行情端点，不是官方承诺稳定性的商业 API。

图表使用项目内 `vendor/echarts.min.js`。板块数据每 60 秒刷新；热股榜适合按 9:00、12:00、20:00 三个时点更新，避免制造不必要的实时噪音。

## AKShare 接入规划

当前 Demo 使用东方财富公开行情作为可运行前端数据源，用来快速验证板块曲线、热股榜、搜索和联动交互。下一阶段主数据源切换为 AKShare，由独立 Python Data Service 负责结构化 A 股数据，再由 Node 后端统一聚合给前端。

- 行情与资金：保留东方财富公开网页接口用于实时板块、分时资金和热股榜原型。
- 结构化数据：通过 AKShare 读取行业资金、概念资金、个股资金、财务摘要、业绩预告和宏观数据。
- 研究资料：接入公告、财报、新闻和用户笔记，作为 Evidence Store 与 RAG 知识库来源。
- 自然语言取数：将用户问题解析为平台内部工具调用，返回可追溯数据表和证据链。
- 报告生成：用结构化行情 + 资讯事件 + 用户判断生成市场日报、板块观察、个股观察和复盘报告。

后端统一输出类似下面的结构：

```json
{
  "name": "机器人",
  "score": 93,
  "netInflow": 48.6,
  "turnover": 1264,
  "volumeRatio": 2.41,
  "change": 3.28,
  "signal": "强趋势",
  "flow": [{"time": "09:30", "value": 2.8}],
  "stocks": [{"name": "拓普集团", "change": 5.84, "netInflow": 8.62}]
}
```

## 数据源路线

- 原型/研究：前端先用东方财富公开网页接口低成本验证交互，但要注意稳定性、频控和授权边界。
- 个人研究：AKShare 作为主要结构化数据源，补齐概念、财务、业绩事件和历史资金。
- 后端架构：`Node API Gateway + Python AKShare Data Service + Evidence Store + AI Agent`。
- 数据体验：任何外部数据源失败时，都要回退到缓存、演示数据或明确的数据状态提示。

## 合规提醒

东方财富服务协议提示，未经交易所书面同意不得复制、转供行情数据或用于开发衍生品。因此当前实现只适合作为本机产品原型，不应直接公开部署或商业分发。正式上线前需取得数据许可，并处理投顾资质、延迟声明、风险揭示和模型回测披露。
