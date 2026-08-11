const fs = require("node:fs");
const path = require("node:path");

function loadLocalEnv(rootDir = process.cwd()) {
  const envPath = path.join(rootDir, ".env.local");
  if (!fs.existsSync(envPath)) return false;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
  return true;
}

module.exports = { loadLocalEnv };
