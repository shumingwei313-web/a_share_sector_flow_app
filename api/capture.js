const { handleCaptureRequest } = require("../src/interfaces/http/captureController");
const { handle } = require("./_marketData");

module.exports = handle((req) => handleCaptureRequest(new URL(req.url, "http://localhost")));
