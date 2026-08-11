# AI 模型接入

## 当前状态

情绪之道已经具备第一版 AI Harness：

```text
用户问题
  -> 当前页面上下文
  -> Capture 信息流
  -> 市场概览
  -> 热股榜
  -> 轻量 RAG 检索
  -> Evidence Pack
  -> OpenAI-compatible 模型
  -> 结构化研究回答
```

如果没有配置模型 API Key，系统会进入 dry-run：只返回命中的证据、工具调用状态、token 估算和降级提示。这样线上展示不会因为模型未配置而报错。

## 推荐模型

早期推荐使用 DeepSeek，原因是成本低、兼容 OpenAI Chat Completions 格式，适合先验证产品链路。

```text
AI_PROVIDER=deepseek
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
DEEPSEEK_API_KEY=你的密钥
```

也可以切换到任何 OpenAI-compatible 服务：

```text
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-5
OPENAI_API_KEY=你的密钥
```

## 本地配置

1. 复制 `.env.example` 为 `.env.local`。
2. 填入真实 API Key。
3. 重启本地服务。

注意：`.env.local` 已加入 `.gitignore`，不要提交真实密钥。

## Vercel 配置

在 Vercel 项目中进入：

```text
Project Settings
  -> Environment Variables
```

添加：

```text
AI_PROVIDER=deepseek
AI_BASE_URL=https://api.deepseek.com/v1
AI_MODEL=deepseek-chat
DEEPSEEK_API_KEY=你的密钥
AI_TIMEOUT_MS=30000
```

保存后重新部署。前端点击右上角「研究助理」时，会调用：

```text
POST /api/agent/query
```

API Key 只存在服务端环境变量中，不进入浏览器。

## RAG 在项目中的作用

RAG 不是额外页面，而是研究助理回答前的证据准备过程。

```text
Question
  -> tokenize
  -> retrieve CaptureItem / MarketSnapshot / HotStock
  -> source weight
  -> top evidence
  -> prompt with citations
```

当前实现位置：

```text
src/application/retrieveResearchEvidence.js
src/application/runResearchAgent.js
src/interfaces/http/agentController.js
api/agent/query.js
```

回答必须包含：

- 结论
- 依据
- 不确定性
- 待验证问题
- 风险提示

## 降级策略

| 场景 | 处理方式 |
| --- | --- |
| 未配置 API Key | 返回 dry-run 证据整理结果 |
| 捕捉数据源失败 | 使用其余数据源继续检索，并标记 degraded |
| 模型超时 | 前端显示研究助理暂不可用 |
| 证据不足 | 明确说明证据不足，不生成确定判断 |

## 下一阶段

- 将 Evidence Store 从关键词检索升级为 Hybrid Search。
- 保存用户采纳、修改和拒绝行为，用于评测 Agent 输出质量。
- 为 Capture、Connect、Conclude、Daily 各模块增加流程内 Agent 动作。
- 建立 Golden Set：新闻、公告、财报、电话会议、行情异动和用户笔记样例。
