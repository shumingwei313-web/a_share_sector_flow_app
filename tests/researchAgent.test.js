const test = require("node:test");
const assert = require("node:assert/strict");
const { runResearchAgent } = require("../src/application/runResearchAgent");
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
