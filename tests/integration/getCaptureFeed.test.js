const test = require("node:test");
const assert = require("node:assert/strict");
const { getCaptureFeed } = require("../../src/application/getCaptureFeed");
const { CAPTURE_TYPES } = require("../../src/domain/captureItem");

test("getCaptureFeed merges providers and degrades when one provider fails", async () => {
  const okProvider = {
    name: "demo-ok",
    fetchCaptureItems: async () => [
      {
        id: "one",
        type: CAPTURE_TYPES.MARKET_ANOMALY,
        title: "资金异动",
        source: "test",
        publishedAt: "2026-08-04T09:30:00.000Z",
      },
    ],
  };
  const badProvider = {
    name: "demo-bad",
    fetchCaptureItems: async () => {
      throw new Error("offline");
    },
  };

  const feed = await getCaptureFeed({ providers: [badProvider, okProvider], type: "all" });

  assert.equal(feed.degraded, true);
  assert.equal(feed.items.length, 1);
  assert.equal(feed.items[0].id, "one");
});

test("getCaptureFeed filters by capture type", async () => {
  const provider = {
    name: "demo",
    fetchCaptureItems: async () => [
      { id: "news", type: CAPTURE_TYPES.NEWS, title: "新闻", source: "test" },
      { id: "report", type: CAPTURE_TYPES.FINANCIAL_REPORT, title: "财报", source: "test" },
    ],
  };

  const feed = await getCaptureFeed({ providers: [provider], type: CAPTURE_TYPES.FINANCIAL_REPORT });

  assert.equal(feed.items.length, 1);
  assert.equal(feed.items[0].id, "report");
});
