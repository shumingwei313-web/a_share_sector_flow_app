# spec: 公开网址访问与 AKShare 服务化

## 背景

情绪之道需要从本地原型走向可访问产品。用户不应打开终端或部署项目，只需要访问域名即可看到研究工作台、捕捉信息流和 AI Agent 入口。

## 用户故事

作为外部访问者，我希望通过域名打开情绪之道，直接看到由服务端聚合后的行情、财报、新闻、电话会议、研报观点和行情异动。

## 验收标准

Given 项目部署在服务器  
When 用户访问域名  
Then Node Web/API Gateway 返回页面和 `/api/*` 数据。

Given AKShare Python Data Service 可用  
When Node 请求 `/api/capture`  
Then Node 通过 `AKSHARE_SERVICE_URL` 获取 AKShare 数据，并返回标准 CaptureItem。

Given AKShare Python Data Service 不可用  
When 用户打开捕捉模块  
Then 页面仍展示降级数据，并返回 `degraded: true`。

Given 用户没有本地开发环境  
When 用户访问域名  
Then 用户不需要安装 Node、Python、AKShare，也不需要打开终端。

## 架构

```text
Browser
-> Domain
-> Node web service
-> /api/capture
-> Application getCaptureFeed
-> Provider Router
-> AKShare HTTP service
-> Demo fallback
```

## 部署要求

- Node 服务负责统一 API，不让浏览器直接接触 AKShare。
- Python AKShare 服务作为内部服务，不直接暴露给普通用户。
- 所有外部数据都必须带 `source`、`asOf`、`evidenceLevel` 或 `degraded` 状态。
- AI Agent 调用必须由服务端执行，不能把 API Key 放到前端。

## 测试计划

- Unit：CaptureItem 标准化。
- Integration：Provider 降级、`/api/capture` 数据结构。
- Architecture：Node HTTP 层不得直接 import 具体 AKShare 服务实现。
- Deployment：Docker Compose 可以启动 `web` 和 `akshare` 两个服务。
