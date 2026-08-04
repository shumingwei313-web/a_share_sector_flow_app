const { getStockDetail, handle } = require("./_marketData");

module.exports = handle((req) => getStockDetail(new URL(req.url, "http://localhost").searchParams.get("code")));
