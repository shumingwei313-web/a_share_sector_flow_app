const { getHotStocks, handle } = require("./_marketData");

module.exports = handle(() => getHotStocks());
