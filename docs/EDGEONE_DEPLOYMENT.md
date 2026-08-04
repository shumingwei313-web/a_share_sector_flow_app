# EdgeOne Pages 国内展示部署

## 目标

EdgeOne Pages 作为国内友好的展示镜像，GitHub 作为唯一代码源。每次代码推送到 GitHub 后，Vercel 和 EdgeOne 都可以自动部署同一份代码。

## 部署入口

- GitHub 仓库：`shumingwei313-web/a_share_sector_flow_app`
- 生产路径：根目录 `./`
- 静态首页：`index.html`
- EdgeOne Node Functions：`cloud-functions/api/[[default]].js`

## EdgeOne Pages 创建项目时填写

| 配置项 | 填写 |
| --- | --- |
| 导入方式 | GitHub |
| 仓库 | `shumingwei313-web/a_share_sector_flow_app` |
| 分支 | `main` |
| 框架预设 | Other / Static / Node 均可，优先选择静态站点 |
| 根目录 | `./` |
| 安装命令 | `npm install` |
| 构建命令 | 留空，或填写 `npm run check` 作为部署前检查 |
| 输出目录 | `./` |

如果控制台要求必须填写构建命令，可以先填：

```bash
npm run check
```

## API 路由

EdgeOne Pages 不直接复用 Vercel 的 `/api/*.js` 规范，因此项目增加了 EdgeOne 专用入口：

```text
cloud-functions/api/[[default]].js
```

它会把请求转发到同一套市场数据逻辑：

- `/api/market`
- `/api/hot-stocks`
- `/api/sector/BK1201/stocks`
- `/api/stock-detail?code=300308`
- `/api/search?q=000001`

## 数据策略

当前阶段：

- 前端优先请求线上 API。
- API 优先使用 `stock-sdk`。
- 数据源失败时使用本地增强演示数据兜底，避免页面空白。

下一阶段：

- EdgeOne / Vercel 定时任务在 9:00、12:00、20:00 刷新缓存。
- 数据写入 Supabase / MongoDB Atlas / 腾讯云数据库。
- 前端只读缓存，提升国内访问稳定性。

## 验收

部署成功后，在 EdgeOne 生成的域名下依次访问：

```text
/api/market
/api/hot-stocks
/api/search?q=000001
```

如果三个接口都返回 JSON，说明国内镜像不仅页面能打开，数据层也已经接通。
