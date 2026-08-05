const { handle, getMarket, getHotStocks } = require("../_marketData");
const { handleAgentQuery } = require("../../src/interfaces/http/agentController");

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 80_000) {
        reject(new Error("请求体过大"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_) {
        reject(new Error("JSON 格式错误"));
      }
    });
    req.on("error", reject);
  });
}

module.exports = handle(async (req) => {
  if (req.method !== "POST") throw new Error("Only POST is supported");
  const body = await readJson(req);
  return handleAgentQuery({
    body,
    tools: {
      getMarket,
      getHotStocks,
    },
  });
});
