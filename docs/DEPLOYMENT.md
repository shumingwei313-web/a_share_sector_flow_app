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

第一阶段推荐使用 Docker 双服务：

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
- 定时任务：9:00、12:00、20:00 更新热股榜和捕捉项。
- 数据库：保存 CaptureItem、ResearchNote、Review。
- 登录与权限：区分公开信息和个人笔记。
- 监控告警：上游失败时显示 degraded，不让页面空白。
