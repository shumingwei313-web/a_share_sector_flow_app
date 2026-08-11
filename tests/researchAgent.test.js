const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveModelConfig, runResearchAgent } = require("../src/application/runResearchAgent");
const { tokenize } = require("../src/application/retrieveResearchEvidence");

test("tokenize keeps financial entities for lightweight RAG", () => {
  const tokens = tokenize("机器人板块里减速器和中大力德怎么验证？");
  assert.ok(tokens.includes("机器人"));
  assert.ok(tokens.includes("减速器"));
  assert.ok(tokens.includes("中大力德"));
});

test("runResearchAgent returns RAG dry-run when model key is missing", async () => {
  const result = await runResearchAgent({
    question: "机器人板块是真受益还是情绪交易？",
    context: { sector: { name: "机器人", code: "BK0740", netInflow: 48.6, change: 3.28 } },
    env: {},
    tools: {
      getCaptureFeed: async () => ({
        items: [{
          id: "cap-robot",
          typeLabel: "行情异动",
          title: "机器人概念出现热度扩散",
          source: "demo",
          summary: "机器人减速器、人形机器人概念热度上行。",
          relatedSectors: ["机器人"],
          relatedConcepts: ["机器人减速器", "人形机器人"],
          relatedCompanies: [{ name: "中大力德", code: "002896" }],
          evidenceLevel: "L2_DATA",
          confidence: 70,
        }],
      }),
      getMarket: async () => ({ sectors: [] }),
      getHotStocks: async () => ({ stocks: [] }),
    },
  });

  assert.equal(result.configured, false);
  assert.equal(result.observability.fallbackUsed, true);
  assert.ok(result.traceId.startsWith("ai-"));
  assert.ok(result.answer.includes("RAG"));
  assert.ok(result.rag.evidence.some((item) => item.title.includes("机器人")));
});

test("resolveModelConfig uses DeepSeek defaults when DeepSeek key exists", () => {
  const config = resolveModelConfig({ DEEPSEEK_API_KEY: "sk-test" });
  assert.equal(config.provider, "deepseek");
  assert.equal(config.baseUrl, "https://api.deepseek.com");
  assert.equal(config.model, "deepseek-v4-flash");
  assert.equal(config.thinking, "disabled");
});

test("runResearchAgent calls OpenAI-compatible model when key exists", async () => {
  let requestUrl = "";
  let requestBody = {};
  const result = await runResearchAgent({
    question: "电子板块资金流入是否有事件支撑？",
    context: { sector: { name: "电子", code: "BK1036", netInflow: 334.9, change: 5.24 } },
    env: {
      AI_PROVIDER: "deepseek",
      AI_BASE_URL: "https://api.deepseek.com",
      AI_MODEL: "deepseek-v4-flash",
      DEEPSEEK_API_KEY: "sk-test",
      DEEPSEEK_THINKING: "disabled",
    },
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "结论：电子板块需要结合公告与资金持续性验证。\n\n风险提示：不构成投资建议。" } }],
          usage: { prompt_tokens: 321, completion_tokens: 42 },
        }),
      };
    },
    tools: {
      getCaptureFeed: async () => ({
        items: [{
          id: "cap-electronics",
          typeLabel: "行情异动",
          title: "电子板块资金异动",
          source: "demo",
          summary: "电子板块主力资金净流入居前。",
          relatedSectors: ["电子"],
          relatedConcepts: ["国产芯片"],
          relatedCompanies: [{ name: "沪电股份", code: "002463" }],
          evidenceLevel: "L2_DATA",
          confidence: 68,
        }],
      }),
      getMarket: async () => ({ sectors: [] }),
      getHotStocks: async () => ({ stocks: [] }),
    },
  });

  assert.equal(result.configured, true);
  assert.equal(result.observability.fallbackUsed, false);
  assert.equal(requestUrl, "https://api.deepseek.com/chat/completions");
  assert.equal(requestBody.model, "deepseek-v4-flash");
  assert.deepEqual(requestBody.thinking, { type: "disabled" });
  assert.ok(result.answer.includes("电子板块"));
  assert.equal(result.usage.inputTokens, 321);
  assert.equal(result.usage.outputTokens, 42);
});
