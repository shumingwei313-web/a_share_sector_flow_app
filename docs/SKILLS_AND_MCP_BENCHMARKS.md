# Skills and MCP Benchmarks

## 结论

情绪之道需要两类外部能力：

- Codex skills：提升项目开发、部署、UI 验证和安全检查效率。
- 金融 MCP / 数据工具：作为未来数据源 provider，进入 Clean Architecture 的 infrastructure 层。

不要把金融 MCP 直接当作产品架构。MCP 更适合给 AI Agent 调工具；面向用户的网页仍应通过标准后端 API 和缓存数据库输出稳定数据。

## 已安装 Codex Skills

来自 `openai/skills`：

| Skill | 用途 | 放在项目里的位置 |
|---|---|---|
| `vercel-deploy` | 检查 Vercel 部署、域名、环境变量、构建失败 | 发布链路 |
| `playwright` | 做线上/本地 UI 回归测试、截图验证、交互验证 | 测试金字塔 E2E 层 |
| `security-best-practices` | 检查密钥、数据接口、用户输入和部署配置风险 | 上线前质量门 |

## 候选金融 MCP / 数据工具

| 项目 | 适配度 | 适合做什么 | 风险 |
|---|---:|---|---|
| `chengzuopeng/stock-sdk` | 高 | 前端/Node 原型取 A 股、港股、美股行情、板块、资金流、龙虎榜、交易日历；也带 MCP | 数据源仍是公开行情接口，要注意稳定性和授权边界 |
| `aahl/mcp-aktools` | 高 | AKShare MCP，覆盖 A 股市场概况、概念资金、龙虎榜、新闻、财务指标 | MCP 适合 Agent 调用，不建议直接暴露给浏览器 |
| `zwldarren/akshare-one-mcp` | 中高 | 中文市场 AKShare MCP，作为备选数据工具 | Star 较少于 mcp-aktools，需验证维护活跃度 |
| `ccq1/cn-financial-mcp` | 中高 | A 股行情、财报、估值、板块、新闻和宏观指标 | 项目较新，先做 benchmark，不直接上生产 |
| `financial-datasets/mcp-server` | 中 | 美股财报、价格、新闻、加密资产；适合海外市场扩展 | 依赖 Financial Datasets API key，不是 A 股主线 |
| `AgentX-ai/yahoo-finance-server` | 中 | Yahoo Finance 股票、新闻、财务数据 | 更偏美股和全球资产，A 股覆盖有限 |

## 推荐接入顺序

1. `stock-sdk`
   - 先用于 Node API Gateway 的 provider 原型。
   - 适合搜索、行情、K 线、资金流、板块、龙虎榜。
   - 原因：JavaScript/TypeScript 生态，和当前前端 + Node 项目贴合。

2. `mcp-aktools`
   - 用于 AI Agent 工具层，不直接服务普通页面。
   - 适合捕捉模块中的新闻、资金、龙虎榜和市场概况。
   - 原因：AKShare 方向最贴近 A 股研究闭环。

3. `financial-datasets/mcp-server`
   - 作为美股和全球资产扩展。
   - 适合后续加入 NVDA、TSM、AVGO 等产业链外部验证。

## Clean Architecture 接入位置

```text
domain
  CaptureItem
  MarketSnapshot
  HotStock
  ResearchEvidence

application
  GetCaptureFeed
  RefreshMarketCache
  AskResearchAgent
  GetResearchObject

infrastructure
  StockSdkProvider
  AkToolsMcpProvider
  FinancialDatasetsProvider
  SupabaseCacheRepository

interfaces
  /api/capture
  /api/market
  /api/research-agent
  Vercel Cron Handler
```

## 下一步 SDD

新增规格：

```text
specs/0006-market-data-provider-benchmark.md
```

验收目标：

- 用 `stock-sdk` 或 AKShare provider 拉取一组 A 股基础行情。
- 标准化为 `MarketSnapshot` / `HotStock`。
- 若上游失败，读取缓存或 demo fallback。
- 不让前端直接 import 外部 SDK。

## 参考链接

- https://github.com/openai/skills
- https://github.com/chengzuopeng/stock-sdk
- https://github.com/aahl/mcp-aktools
- https://github.com/zwldarren/akshare-one-mcp
- https://github.com/ccq1/cn-financial-mcp
- https://github.com/financial-datasets/mcp-server
- https://github.com/AgentX-ai/yahoo-finance-server
