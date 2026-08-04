const { getSectorStocks, handle } = require("../../_marketData");

module.exports = handle((req) => {
  const match = new URL(req.url, "http://localhost").pathname.match(/\/api\/sector\/([^/]+)\/stocks/);
  return getSectorStocks(match?.[1] || "");
});
