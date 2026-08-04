# spec: MCP 捕捉信息流双通道

## 背景

总览页行情、热股、搜索和公司详情优先通过 `stock-sdk` 数据工具接入。捕捉模块不应直接依赖某一个网页端点，而要把不同市场的信息源统一成 `CaptureItem`，进入研究闭环。

## 用户故事

作为个人研究者，我希望捕捉模块分成 A 股和美股两条信息流：

- A 股：使用 `mcp-aktools` 承接 AKShare 生态中的板块、龙虎榜、新闻、公告、财报和行情异动。
- 美股：使用 `financial-datasets/mcp-server` 承接美股新闻、财报、电话会议和公司事件。

## 验收标准

- Given 用户打开捕捉模块  
  When 数据源未配置真实 MCP 网关  
  Then 页面仍展示 A 股和美股两条结构化样例信息流，并标记 `MCP 待接入`。

- Given 用户选择 A股筛选  
  Then 信息流只显示 `market=A股` 的 CaptureItem。

- Given 用户选择 美股筛选  
  Then 信息流只显示 `market=美股` 的 CaptureItem。

- Given 上游 MCP 网关配置完成  
  Then provider 可以从 `MCP_AKTOOLS_HTTP_URL` 和 `FINANCIAL_DATASETS_MCP_HTTP_URL` 拉取数据，并归一化成 CaptureItem。

## 架构约束

- 前端不直接调用 MCP。
- MCP 工具只存在于 `infrastructure/data-sources` 或 Agent/定时任务层。
- `application/getCaptureFeed` 只编排 provider，不关心 MCP 字段。
- 所有外部资料必须保留 `source`、`provider`、`market`、`publishedAt` 和 `evidenceLevel`。
