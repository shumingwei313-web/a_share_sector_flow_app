# 信息流水线

## 总体流程

```text
Source
-> Ingestion
-> Normalization
-> Entity Linking
-> Industry Mapping
-> Evidence Store
-> Research Graph
-> Agent Reasoning
-> User Note / Report / Review
```

## 信息来源

早期优先使用低成本和公开来源：

- 行情与资金：东方财富公开端点，本地原型使用。
- A 股结构化数据：AKShare，用于行业资金、概念资金、个股资金、财务摘要、业绩事件和宏观数据。
- 新闻资讯：公开财经新闻、公司新闻、行业新闻。
- 公告：交易所公告、公司公告。
- 财报：年报、季报、业绩预告。
- 电话会议：用户手动上传文字稿或摘要。
- 研报观点：用户手动导入摘要，后续再接授权数据。
- 用户输入：关注理由、假设、疑问、复盘结论。

## AKShare 位置

AKShare 不直接进入前端，而是通过数据服务进入标准化层：

```text
AKShare
-> Python Data Service
-> Node API Aggregator
-> Normalization
-> Evidence Store / Research Graph
-> Web UI / Agent
```

## 标准化实体

```json
{
  "id": "event_20260803_001",
  "type": "event",
  "title": "某公司发布先进封装扩产公告",
  "source": "company_announcement",
  "publishedAt": "2026-08-03T09:30:00+08:00",
  "entities": ["先进封装", "半导体设备", "某公司"],
  "summary": "公司计划扩建先进封装产能。",
  "evidenceUrl": "https://example.com",
  "confidence": 0.82
}
```

## 产业链映射

每条信息尽量映射到：

```text
主题：AI 基础设施
行业：半导体
产业链节点：先进封装
上下游：设备、材料、晶圆制造、封测、服务器
相关公司：A 公司、B 公司、C 公司
影响方向：收入、成本、产能、价格、竞争格局
```

## 证据层级

证据需要分级，避免把传闻和公告混在一起：

| 等级 | 类型 | 可信度 |
| --- | --- | --- |
| L1 | 公司公告、交易所文件、财报 | 高 |
| L2 | 电话会议、管理层交流纪要 | 较高 |
| L3 | 券商研报、行业报告 | 中高 |
| L4 | 主流媒体新闻 | 中 |
| L5 | 社媒、传闻、热榜 | 低 |

## 输出结构

系统最终不只输出一句总结，而是输出可复盘结构：

```text
发生了什么
影响链条
相关公司
市场反应
可能的预期差
证据列表
我的判断
待验证问题
复盘日期
```
