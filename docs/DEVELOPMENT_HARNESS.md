# 开发 Harness

## 开发范式

每个新功能先走 SDD，再做 TDD。

```text
1. 在 specs/ 写清楚用户场景、输入输出和验收标准
2. 在 docs/ 更新领域模型或接口约定
3. 写最小测试，先覆盖纯业务规则
4. 实现功能
5. 跑 npm run check
6. 手动或 E2E 验证关键用户路径
7. 更新 README 或 ADR
```

## 规格模板

```md
# spec: 功能名

## 背景

## 用户故事

作为个人投资者，我希望...

## 验收标准

Given ...
When ...
Then ...

## 数据需求

## 风险与边界

## 测试计划
```

## 测试金字塔

- Unit 70%：评分、排序、概念聚合、风险判断、报告片段生成等纯逻辑。
- Integration 20%：HTTP API、数据源适配器、缓存降级、schema 校验。
- E2E 10%：打开首页、点击板块、筛选概念、查看个股、生成报告、保存观察。

## 质量检查

当前 MVP 的最低检查：

```bash
./.runtime/node-v24.15.0-darwin-arm64/bin/node scripts/quality-check.mjs
```

检查内容：

- `server.js` 语法检查。
- `app.js` 语法检查。
- `tests/` 单元与集成测试。
- `scripts/architecture-check.mjs` 架构依赖护栏。
- 必要项目文档是否存在。
- 页面入口文件是否引用核心脚本和样式。

后续升级：

- ESLint + Prettier。
- Vitest 单元测试。
- Supertest API 集成测试。
- Playwright E2E 测试。
- dependency-cruiser 架构依赖护栏。
- Zod 或 Valibot 接口数据校验。

## 架构护栏

- 新数据源必须放在 `infrastructure/data-sources`。
- 新分析规则必须优先抽到 `domain` 或 `application`。
- 外部数据必须保留 `source`、`asOf` 和异常降级路径。
- AI 生成内容必须带风险提示，不得输出确定性收益承诺。
- 用户笔记、关注列表、复盘数据要和行情数据分开存储。
- `domain` 不允许依赖 HTTP、DOM、文件系统、数据库、模型 API 或具体数据源。
- `application` 只能通过 provider 接口编排外部能力，不直接 import AKShare、东方财富或 MCP。
- `interfaces/http` 只负责请求响应和参数解析，不放研究判断规则。
- 每条新竖切至少包含一个 spec、一个 domain/application 测试，以及必要的文档更新。

## 当前可执行命令

```bash
./.runtime/node-v24.15.0-darwin-arm64/bin/node --test tests/**/*.test.js
./.runtime/node-v24.15.0-darwin-arm64/bin/node scripts/architecture-check.mjs
./.runtime/node-v24.15.0-darwin-arm64/bin/node scripts/quality-check.mjs
```

## Clean Architecture 当前落点

```text
src/domain/captureItem.js
  CaptureItem 标准化、证据等级、类型约束。

src/application/getCaptureFeed.js
  捕捉信息流用例，合并 AKShare、Demo 和未来 MCP provider。

src/infrastructure/data-sources/
  akshareCaptureProvider.js
  demoCaptureProvider.js
  captureProviderRouter.js

src/interfaces/http/captureController.js
  /api/capture 的 HTTP 入口。
```

## 上下文管理

给 AI 或开发者开工前优先读取：

```text
docs/PROJECT_CONTEXT.md
docs/BENCHMARK_INVESTMENT_OS.md
docs/RESEARCH_LOOP.md
docs/ARCHITECTURE.md
docs/INFORMATION_PIPELINE.md
docs/DATA_SOURCE_AKSHARE.md
docs/AI_HARNESS.md
docs/DEVELOPMENT_HARNESS.md
docs/ROADMAP.md
specs/
```

当需求变化时，先改文档和规格，再改代码。这样项目会拥有自己的记忆。
