const { searchSecurities, handle } = require("./_marketData");

module.exports = handle((req) => searchSecurities(new URL(req.url, "http://localhost").searchParams.get("q")));
