# UI Benchmark 组合

## 采用原则

情绪之道不照搬单个模板，而是采用“组合 benchmark”：

```text
Investment OS: 产品信息架构
Figma SDS: 设计系统与代码连接方法
shadcn/ui: Web 应用骨架与组件状态
Untitled UI: 细节密度与表单/弹窗/空状态
Finance Dashboard Dark: 金融暗色氛围
Tremor: 数据看板与 KPI 呈现
TradingView Lightweight Charts: 金融图表交互
```

每个 benchmark 只负责它擅长的部分，避免把不同风格硬拼。

## 1. Investment OS

角色：产品信息架构和研究叙事 benchmark。

借鉴：

- 左侧栏承载研究流程，而不是普通菜单。
- 顶栏统一搜索、系统状态、工具按钮和 AI 入口。
- 首页不是行情页，而是研究入口。
- 文案强调持续追踪投资逻辑，而不是追逐股价。

落地到情绪之道：

- 左侧栏固定为 `总览 / 捕捉 / 连接 / 比较 / 判断 / 记录 / 复盘 / 研究日报`。
- 首页主内容要从“板块资金看板”逐步升级为“个人研究工作台”。
- 搜索入口未来连接 A 股证券、板块、主题、事件和用户笔记。

## 2. Figma Simple Design System

角色：设计系统和 code-design bridge benchmark。

借鉴：

- Variables、Styles、Components、Code Connect 的组织方法。
- 设计 token 与代码 token 保持同源。
- 组件不只追求视觉，还要写清楚用法和约束。

落地到情绪之道：

- 先在 `docs/DESIGN_SYSTEM.md` 定义颜色、间距、圆角、卡片、表格和弹窗规则。
- 后续在 Figma 中建立 light/dark 变量组。
- 如果创建 Figma 文件，优先把 sidebar、topbar、panel、table、chart shell、popover 做成组件。

## 3. shadcn/ui Dashboard

角色：现代 Web app 骨架 benchmark。

借鉴：

- Sidebar + Topbar + Content 的布局骨架。
- 按钮、输入框、卡片、弹窗、菜单、表格的状态一致性。
- 低装饰、高可用的组件风格。

落地到情绪之道：

- 顶栏按钮必须区分直接切换、轻量浮层和深度弹窗。
- 卡片圆角保持 8px 左右，hover/active 状态统一。
- 后续若迁移 React，优先考虑 Next.js + shadcn/ui。

## 4. Untitled UI

角色：细节和组件完整度 benchmark。

借鉴：

- 空状态、表单状态、弹窗内容密度。
- 字号层级和间距节奏。
- 输入框、标签、辅助说明、错误提示的完整交互。

落地到情绪之道：

- 搜索结果、AI Agent、研究笔记、报告生成器都要有空状态、加载状态和错误状态。
- 文案要短、清楚、可执行。
- 表单和弹窗不堆说明文字，优先让用户完成动作。

## 5. Finance Dashboard Dark

角色：金融暗色氛围 benchmark。

借鉴：

- 深色背景、低对比边框、高亮数字的金融终端感。
- 数字、图表、列表的密度。
- 不用大面积炫彩渐变。

落地到情绪之道：

- 暗色主题作为主体验，亮色主题作为“纸面研究台”。
- 红色用于 A 股上涨和风险提示，绿色/青色用于在线、研究链和选中状态。
- 暗色 UI 必须降低盯盘疲劳，不制造紧张感。

## 6. Tremor

角色：数据看板 benchmark。

借鉴：

- KPI 卡片的层级：标签、主数字、辅助说明。
- 图表与表格的组合方式。
- Dashboard section 的留白和信息密度。

落地到情绪之道：

- 总览指标保留 `主力净流入 / 活跃板块 / 风险板块 / 策略模式`。
- 每个指标都要解释它用于什么判断。
- 图表旁边的 AI 结论要像研究批注，不像营销卡片。

## 7. TradingView Lightweight Charts

角色：金融图表交互 benchmark。

借鉴：

- 十字光标。
- 多序列显隐。
- 时间轴、价格轴、悬浮读数。
- K 线、成交量、标记点和 annotation。

落地到情绪之道：

- 当前 ECharts 继续作为 MVP 图表引擎。
- 选中曲线时，下方热门概念和个股必须联动。
- 后续加入 K 线或更专业分时图时，再评估局部引入 Lightweight Charts。

## 执行优先级

### 当前阶段

1. 统一暗色/亮色主题。
2. 修正 sidebar + topbar + content 的布局密度。
3. 打磨搜索栏、工具按钮、浮层和 AI 弹窗。
4. 让总览图表和板块概念联动更清楚。

### 下一阶段

1. 创建 Figma 设计系统文件。
2. 把当前代码 token 映射为 Figma Variables。
3. 设计 sidebar、topbar、panel、table、chart shell 的组件。
4. 选中 Figma node 后，用 Figma MCP 回写代码。

## 禁止事项

- 不复制商业产品的完整视觉。
- 不把金融 dashboard 做成营销官网。
- 不让不同 UI kit 的风格同时出现在同一屏。
- 不为了好看牺牲研究链路、数据状态和可复盘性。
