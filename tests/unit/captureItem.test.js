const test = require("node:test");
const assert = require("node:assert/strict");
const { CAPTURE_TYPES, normalizeCaptureItem } = require("../../src/domain/captureItem");

test("normalizeCaptureItem keeps evidence traceability fields", () => {
  const item = normalizeCaptureItem({
    type: CAPTURE_TYPES.FINANCIAL_REPORT,
    title: "某公司业绩预告",
    source: "akshare.stock_yjyg_em",
    relatedCompanies: [{ name: "测试公司", code: "000001" }],
    confidence: 120,
  });

  assert.equal(item.type, CAPTURE_TYPES.FINANCIAL_REPORT);
  assert.equal(item.title, "某公司业绩预告");
  assert.equal(item.source, "akshare.stock_yjyg_em");
  assert.equal(item.relatedCompanies[0].code, "000001");
  assert.equal(item.confidence, 100);
});

test("normalizeCaptureItem rejects unknown type into news fallback", () => {
  const item = normalizeCaptureItem({ type: "rumor", title: "传闻" });
  assert.equal(item.type, CAPTURE_TYPES.NEWS);
  assert.equal(item.typeLabel, "新闻");
});
