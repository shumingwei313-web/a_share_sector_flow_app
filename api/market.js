const { getMarket, handle } = require("./_marketData");

module.exports = handle(() => getMarket());
