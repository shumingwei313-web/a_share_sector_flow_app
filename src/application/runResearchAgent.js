const { retrieveResearchEvidence } = require("./retrieveResearchEvidence");

const DEFAULT_SYSTEM_PROMPT = [
  "你是情绪之道的个人投研助手。",
  "你的任务不是提供买卖建议，而是帮助用户整理公开信息、资金情绪、产业链传导、研究假设、反证和复盘问题。",
  "你必须基于给定证据回答。证据不足时要明确说证据不足。",
  "输出必须包含：结论、依据、不确定性、待验证问题、风险提示。",
  "禁止输出确定收益承诺、直接买卖指令、没有来源的事实判断。",
].join("\n");

async function runResearchAgent({ question, context = {}, tools = {}, env = process.env, fetchImpl = fetch } = {}) {
  const cleanQuestion = String(question || "").trim();
  if (!cleanQuestion) throw new Error("请输入问题");

  const startedAt = Date.now();
  const traceId = `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const rag = await retrieveResearchEvidence({ question: cleanQuestion, context, tools, limit: 8 });
  const prompt = buildPrompt({ question: cleanQuestion, context, rag });
  const systemPrompt = buildSystemPrompt(context);
  const inputTokens = estimateTokens(`${systemPrompt}\n${prompt}`);
  const config = resolveModelConfig(env);

  if (!config.apiKey) {
    const answer = buildDryRunAnswer({ question: cleanQuestion, rag });
    return {
      configured: false,
      traceId,
      model: config.model,
      provider: config.provider,
      answer,
      rag,
      usage: { inputTokens, outputTokens: estimateTokens(answer), totalTokens: inputTokens + estimateTokens(answer) },
      billing: { currency: "USD", estimatedCost: 0, billable: false },
      observability: {
        latencyMs: Date.now() - startedAt,
        fallbackUsed: true,
        toolCalls: summarizeToolCalls(rag),
      },
    };
  }

  let llm;
  try {
    llm = await callOpenAiCompatible({ config, system: systemPrompt, prompt, fetchImpl });
  } catch (error) {
    const answer = buildModelFallbackAnswer({ question: cleanQuestion, rag, error });
    return {
      configured: true,
      traceId,
      model: config.model,
      provider: config.provider,
      answer,
      rag,
      usage: { inputTokens, outputTokens: estimateTokens(answer), totalTokens: inputTokens + estimateTokens(answer) },
      billing: { currency: "USD", estimatedCost: 0, billable: false },
      observability: {
        latencyMs: Date.now() - startedAt,
        fallbackUsed: true,
        providerError: error.message,
        toolCalls: summarizeToolCalls(rag),
      },
    };
  }
  const outputTokens = llm.usage.outputTokens || estimateTokens(llm.answer);
  const actualInputTokens = llm.usage.inputTokens || inputTokens;
  const estimatedCost = estimateCost({
    inputTokens: actualInputTokens,
    outputTokens,
    inputPrice: Number(env.AI_INPUT_PRICE_PER_1K || 0),
    outputPrice: Number(env.AI_OUTPUT_PRICE_PER_1K || 0),
  });

  return {
    configured: true,
    traceId,
    model: config.model,
    provider: config.provider,
    answer: llm.answer || "AI Agent 暂无输出。",
    rag,
    usage: { inputTokens: actualInputTokens, outputTokens, totalTokens: actualInputTokens + outputTokens },
    billing: { currency: "USD", estimatedCost, billable: true },
    observability: {
      latencyMs: Date.now() - startedAt,
      fallbackUsed: false,
      toolCalls: summarizeToolCalls(rag),
    },
  };
}

function buildSystemPrompt(context = {}) {
  const workflowInstruction = resolveWorkflowInstruction(context.workflowStep);
  return [
    DEFAULT_SYSTEM_PROMPT,
    "",
    "当前 AI Harness 约束：",
    workflowInstruction,
    "",
    "Human-in-the-loop 要求：你输出的是研究草稿，必须提示用户确认证据、假设和复盘动作后再保存。",
  ].join("\n");
}

function resolveWorkflowInstruction(workflowStep = "") {
  const instructions = {
    capture: "当前阶段是 Capture 捕捉。只整理事件、新闻、公告、财报、电话会议、研报观点和行情异动；输出要包含：发生了什么、来源、时间、影响对象、证据等级、待验证问题。不要提前形成投资结论。",
    connect: "当前阶段是 Connect 连接。把证据连接到行业、产业链节点、上下游和公司；输出要包含：事件 -> 行业 -> 产业链节点 -> 公司、证据引用、缺失证据、需要调用的下一类资料。",
    compare: "当前阶段是 Compare 比较。比较基本面证据、市场反应、资金流、人气和已有预期；输出要包含：已反应部分、尚未验证部分、可能情绪噪音、反证、预期差候选。",
    conclude: "当前阶段是 Conclude 判断。生成可追溯研究假设；输出要包含：核心假设、支持证据、反证、不确定性、置信度、待验证问题。禁止给买卖指令。",
    commit: "当前阶段是 Commit 记录。把用户判断整理为可复盘笔记；输出要包含：为什么关注、支持证据、反证、置信度、复盘日期建议、需要保存的字段。",
    check: "当前阶段是 Check 复盘。对历史假设生成验证清单；输出要包含：需要跟踪的指标、证伪信号、7天复盘问题、30天复盘问题、需要修正的判断偏差。",
    daily: "当前阶段是 Daily 研究日报。把今日市场、证据、研究假设、反证和复盘事项整理为个人研究日报；输出要克制、结构化、可引用。",
  };
  return instructions[workflowStep] || "当前阶段未指定。请按研究闭环输出，并优先说明证据边界。";
}

function buildPrompt({ question, context, rag }) {
  const pageContext = {
    workflowStep: context?.workflowStep || null,
    moduleTitle: context?.moduleTitle || null,
    selectedSector: context?.sector ? {
      name: context.sector.name,
      code: context.sector.code,
      netInflow: context.sector.netInflow,
      change: context.sector.change,
      signal: context.sector.signal,
    } : null,
    selectedConcepts: context?.concepts || [],
    hotStocks: (context?.hotStocks || []).slice(0, 5),
    marketIndex: context?.marketIndex || null,
    researchNote: context?.researchNote || null,
    activeResearchTask: context?.activeResearchTask || null,
    agentPipeline: (context?.agentPipeline || []).map((agent) => ({
      name: agent.name,
      title: agent.title,
      input: agent.input,
      output: agent.output,
    })),
  };

  return [
    "请基于以下 RAG 证据包回答用户问题。",
    "",
    `用户问题：${question}`,
    "",
    `当前页面上下文：${JSON.stringify(pageContext, null, 2)}`,
    "",
    "RAG 证据包：",
    JSON.stringify(rag.evidence.map((item, index) => ({
      index: index + 1,
      type: item.type,
      title: item.title,
      source: item.source,
      summary: item.summary,
      sectors: item.sectors,
      concepts: item.concepts,
      companies: item.companies,
      evidenceLevel: item.evidenceLevel,
      confidence: item.confidence,
    })), null, 2),
    "",
    "请按以下结构输出：",
    "1. 结论：一句话说明当前更像什么研究信号。",
    "2. 依据：用编号引用 RAG 证据。",
    "3. 不确定性：哪些地方证据不足或可能只是情绪。",
    "4. 待验证问题：下一步应该查什么数据、公告、财报或电话会议。",
    "5. 风险提示：说明这不是投资建议。",
  ].join("\n");
}

async function callOpenAiCompatible({ config, system, prompt, fetchImpl }) {
  const body = {
    model: config.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    temperature: Number(config.temperature),
    max_tokens: Number(config.maxOutputTokens),
    stream: false,
  };
  if (config.provider === "deepseek") {
    body.thinking = { type: config.thinking };
  }

  const response = await fetchImpl(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Number(config.timeoutMs || 30_000)),
  });
  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  const payload = await response.json();
  const answer = payload.choices?.[0]?.message?.content || payload.output_text || "";
  return {
    answer,
    usage: {
      inputTokens: payload.usage?.prompt_tokens || payload.usage?.input_tokens || 0,
      outputTokens: payload.usage?.completion_tokens || payload.usage?.output_tokens || 0,
    },
  };
}

function resolveModelConfig(env) {
  const hasDeepSeek = Boolean(env.DEEPSEEK_API_KEY);
  const provider = env.AI_PROVIDER || (hasDeepSeek ? "deepseek" : "openai-compatible");
  return {
    provider,
    apiKey: env.AI_API_KEY || env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY || "",
    baseUrl: env.AI_BASE_URL || (hasDeepSeek ? "https://api.deepseek.com" : "https://api.openai.com/v1"),
    model: env.AI_MODEL || env.OPENAI_MODEL || (hasDeepSeek ? "deepseek-v4-flash" : "gpt-5"),
    temperature: env.AI_TEMPERATURE || 0.2,
    maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS || 1200,
    thinking: env.DEEPSEEK_THINKING || "disabled",
    timeoutMs: env.AI_TIMEOUT_MS || 30_000,
  };
}

function buildDryRunAnswer({ question, rag }) {
  const top = rag.evidence.slice(0, 4);
  const evidenceLines = top.length
    ? top.map((item, index) => `${index + 1}. ${item.title}（${item.type}，来源：${item.source}）`).join("\n")
    : "暂无命中证据。";
  return [
    "结论：研究助理已经完成 RAG 证据检索；当前未配置模型 API Key，因此先返回可解释的证据整理结果。",
    "",
    `依据：系统已根据问题「${question}」检索当前页面上下文、捕捉信息流、市场概览和热股榜，命中的证据包括：\n${evidenceLines}`,
    "",
    "不确定性：当前未调用真实模型，只能说明检索到了哪些证据，不能完成完整产业链推理。",
    "",
    "待验证问题：下一步配置 AI_API_KEY 或 DEEPSEEK_API_KEY 后，让模型基于这些证据输出结构化研究假设；同时把 Evidence Store 从关键词检索升级为向量检索。",
    "",
    "风险提示：以上仅用于研究流程演示，不构成投资建议。",
  ].join("\n");
}

function buildModelFallbackAnswer({ question, rag, error }) {
  const dryRun = buildDryRunAnswer({ question, rag });
  return [
    "结论：模型服务暂时不可用，系统已保留 RAG 证据检索结果并进入降级输出。",
    "",
    dryRun.replace("结论：研究助理已经完成 RAG 证据检索；当前未配置模型 API Key，因此先返回可解释的证据整理结果。", "证据检索：已完成当前问题的 Evidence Pack 准备。"),
    "",
    `技术状态：${error?.message || "provider unavailable"}`,
  ].join("\n");
}

function summarizeToolCalls(rag) {
  return [
    { name: "search_capture_items", status: rag.degraded ? "degraded" : "ok", resultCount: rag.evidence.filter((item) => !["板块行情", "热股榜"].includes(item.type)).length },
    { name: "get_market_overview", status: rag.degraded ? "maybe_degraded" : "ok", resultCount: rag.evidence.filter((item) => item.type === "板块行情").length },
    { name: "get_hot_stocks", status: rag.degraded ? "maybe_degraded" : "ok", resultCount: rag.evidence.filter((item) => item.type === "热股榜").length },
  ];
}

function estimateTokens(text) {
  return Math.max(1, Math.ceil(String(text || "").length / 2));
}

function estimateCost({ inputTokens, outputTokens, inputPrice, outputPrice }) {
  return Number(((inputTokens / 1000) * inputPrice + (outputTokens / 1000) * outputPrice).toFixed(6));
}

module.exports = {
  buildSystemPrompt,
  buildPrompt,
  resolveModelConfig,
  resolveWorkflowInstruction,
  runResearchAgent,
};
