const { runResearchAgent } = require("../../application/runResearchAgent");
const { getCaptureFeed } = require("../../application/getCaptureFeed");
const { createCaptureProviders } = require("../../infrastructure/data-sources/captureProviderRouter");

async function handleAgentQuery({ body, tools = {}, env = process.env, fetchImpl = fetch } = {}) {
  const question = String(body?.question || "").trim();
  const context = body?.context || {};
  const agentTools = {
    getCaptureFeed: (params) => getCaptureFeed({ providers: createCaptureProviders(), ...params }),
    ...tools,
  };
  return runResearchAgent({ question, context, tools: agentTools, env, fetchImpl });
}

module.exports = { handleAgentQuery };
