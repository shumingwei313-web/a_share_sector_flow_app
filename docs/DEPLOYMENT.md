# 上线与域名访问

## 关键结论

情绪之道如果只作为静态网页，别人打开域名只能看到前端，无法稳定使用 AKShare、AI Agent、缓存和定时任务。

要做到“别人通过网址和域名打开，不用打开终端，也不用自己部署”，需要由项目方部署一次在线服务：

```text
User Browser
-> https://你的域名
-> Node Web/API Gateway
-> Application Use Cases
-> Data Provider Router
   -> Eastmoney public endpoints
   -> AKShare Python Data Service
   -> Demo fallback
-> normalized research data
-> Web UI
```

用户不需要终端；终端和部署只发生在服务器或云平台。

## 推荐部署形态

第一阶段已经使用 Vercel 发布静态前端：

```text
https://a-share-sector-flow-app.vercel.app/
```

这适合让别人直接打开产品界面，不需要终端，也不需要安装 Node。当前线上版本在 API 不可用时会降级为演示数据。

第二阶段有两条后端路线。

### 路线 A：Docker 双服务

适合需要实时 API、AI Agent 和私有化部署时使用：

```text
web
  Node.js
  负责前端静态文件、/api/market、/api/capture、/api/agent/query。

akshare
  Python + FastAPI + AKShare
  负责财报、资金异动、后续新闻/公告/研报等数据采集。
```

本项目已提供：

```text
Dockerfile
docker-compose.yml
services/akshare_service/Dockerfile
services/akshare_service/app.py
services/akshare_service/requirements.txt
```

### 路线 B：Serverless + 定时缓存

适合个人平台早期控制成本。核心思想是：用户访问页面时只读缓存，不临时跑 AKShare。

```text
Vercel Static Frontend
-> /api/cache/* 或外部数据库 REST API
-> Supabase / MongoDB Atlas / Redis Cloud

Vercel Cron / cron-job.org / GitHub Actions Schedule
-> Serverless Fetch Job
-> AKShare Python Data Service or one-off Python collector
-> normalize CaptureItem / MarketSnapshot / HotStock
-> upsert cache database
```

建议更新频率：

```text
09:00  开盘前后：更新昨夜公告、研报观点、早盘热榜候选
12:00  午间：更新上午行情异动、板块资金、热股榜
20:00  晚间：更新公告、财报、新闻、复盘材料
```

这条路线的优点：

- 不需要一直在线服务器，成本更低。
- 前端响应快，因为读取的是缓存结果。
- 上游失败时可以继续展示上一版缓存，并标记 `degraded` 或 `stale`。

这条路线的代价：

- 数据不是逐秒实时，而是按批次更新。
- 需要维护数据库表结构、任务重试、数据过期状态。
- AKShare 运行环境仍然需要在某个 Python 任务里存在，不能只靠纯静态前端完成。

建议缓存表：

```text
market_snapshots
  id, captured_at, source, payload, stale_after

capture_items
  id, type, title, summary, symbols, sectors, published_at, source, url, payload

hot_stocks
  id, captured_at, rank, code, name, heat, change_pct, net_inflow, payload

research_notes
  id, object_type, object_id, thesis, evidence_ids, created_at, updated_at
```

Clean Architecture 中的位置：

```text
domain
  CaptureItem, MarketSnapshot, HotStock

application
  RefreshCaptureFeed, GetCachedOverview, GetResearchObject

infrastructure
  AkshareCollector, SupabaseCacheRepository, CronTriggerAdapter

interfaces
  Vercel API Route, Static Web UI
```

## 本地模拟线上

```bash
docker compose up --build
```

打开：

```text
http://127.0.0.1:4173
```

验证 AKShare 服务：

```text
http://127.0.0.1:8765/health
http://127.0.0.1:4173/api/capture
```

## 域名上线方式

可选路线：

1. 云服务器
   - 购买一台服务器。
   - 安装 Docker。
   - 上传项目。
   - `docker compose up -d --build`。
   - 用 Nginx/Caddy 把域名反代到 `web:4173`。

2. PaaS 平台
   - 使用支持 Docker Compose 或多服务的云平台。
   - 配置 `web` 和 `akshare` 两个服务。
   - 让公网域名指向 `web` 服务。

3. 前后端拆分
   - 前端放静态托管。
   - Node API 和 AKShare 服务单独部署。
   - 前端配置 `API_BASE_URL` 指向后端域名。

4. Serverless 定时缓存
   - 前端继续放在 Vercel。
   - 使用 Vercel Cron 或 cron-job.org 定时触发抓取。
   - 抓取结果写入 Supabase / MongoDB Atlas。
   - 前端读取缓存数据，并显示最近更新时间。

## 环境变量

```text
CAPTURE_PROVIDER=auto
AKSHARE_SERVICE_URL=http://akshare:8765
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5
AI_INPUT_PRICE_PER_1K=0
AI_OUTPUT_PRICE_PER_1K=0
```

## 数据与合规

AKShare 适合个人研究和本地/私有化原型。公开站点或商业化前，需要确认数据源授权、接口频率和再分发边界。

上线后建议增加：

- 数据缓存：减少对上游请求压力。
- 定时任务：9:00、12:00、20:00 更新热股榜、市场概览和捕捉项。
- 数据库：保存 CaptureItem、ResearchNote、Review。
- 登录与权限：区分公开信息和个人笔记。
- 监控告警：上游失败时显示 degraded，不让页面空白。
