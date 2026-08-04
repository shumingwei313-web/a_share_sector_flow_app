import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "server.js",
  "Dockerfile",
  "docker-compose.yml",
  "vercel.json",
  "edgeone.json",
  "cloud-functions/api/[[default]].js",
  "vendor/echarts.min.js",
  "scripts/architecture-check.mjs",
  "docs/PROJECT_CONTEXT.md",
  "docs/BENCHMARK_INVESTMENT_OS.md",
  "docs/DESIGN_SYSTEM.md",
  "docs/UI_BENCHMARKS.md",
  "docs/SKILLS_AND_MCP_BENCHMARKS.md",
  "docs/EDGEONE_DEPLOYMENT.md",
  "docs/RESEARCH_LOOP.md",
  "docs/ARCHITECTURE.md",
  "docs/INFORMATION_PIPELINE.md",
  "docs/DATA_SOURCE_AKSHARE.md",
  "docs/AI_HARNESS.md",
  "docs/DEVELOPMENT_HARNESS.md",
  "docs/DEPLOYMENT.md",
  "docs/ROADMAP.md",
  "specs/0001-personal-investment-os.md",
  "specs/0002-research-operating-system.md",
  "specs/0003-akshare-data-provider.md",
  "specs/0004-capture-clean-architecture.md",
  "specs/0005-public-deployment-akshare.md",
  "services/akshare_service/app.py",
  "services/akshare_service/Dockerfile",
  "services/akshare_service/requirements.txt",
];

const checks = [];

function pass(name) {
  checks.push({ name, ok: true });
}

function fail(name, detail) {
  checks.push({ name, ok: false, detail });
}

for (const file of requiredFiles) {
  existsSync(file) ? pass(`exists ${file}`) : fail(`exists ${file}`, "missing file");
}

for (const file of ["server.js", "app.js"]) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status === 0) {
    pass(`syntax ${file}`);
  } else {
    fail(`syntax ${file}`, result.stderr || result.stdout || "syntax check failed");
  }
}

for (const [name, args] of [
  ["tests", ["--test", ...findTestFiles("tests")]],
  ["architecture guards", ["scripts/architecture-check.mjs"]],
]) {
  const result = spawnSync(process.execPath, args, { encoding: "utf8" });
  if (result.status === 0) {
    pass(name);
  } else {
    fail(name, result.stderr || result.stdout || `${name} failed`);
  }
}

if (existsSync("index.html")) {
  const html = readFileSync("index.html", "utf8");
  html.includes("styles.css") ? pass("index links styles.css") : fail("index links styles.css", "stylesheet missing");
  html.includes("app.js") ? pass("index links app.js") : fail("index links app.js", "app script missing");
  html.includes("echarts") ? pass("index links echarts") : fail("index links echarts", "chart runtime missing");
}

const contextChecks = [
  ["docs/PROJECT_CONTEXT.md", "持续追踪投资逻辑"],
  ["docs/RESEARCH_LOOP.md", "产业链传导"],
  ["docs/RESEARCH_LOOP.md", "复盘"],
  ["docs/BENCHMARK_INVESTMENT_OS.md", "研究操作系统"],
  ["docs/DESIGN_SYSTEM.md", "亮色和暗色"],
  ["docs/DESIGN_SYSTEM.md", "研究闭环导航"],
  ["docs/UI_BENCHMARKS.md", "组合 benchmark"],
  ["docs/UI_BENCHMARKS.md", "Figma Simple Design System"],
  ["docs/UI_BENCHMARKS.md", "TradingView Lightweight Charts"],
  ["docs/SKILLS_AND_MCP_BENCHMARKS.md", "Codex skills"],
  ["docs/SKILLS_AND_MCP_BENCHMARKS.md", "mcp-aktools"],
  ["docs/SKILLS_AND_MCP_BENCHMARKS.md", "StockSdkProvider"],
  ["docs/EDGEONE_DEPLOYMENT.md", "EdgeOne Pages"],
  ["docs/EDGEONE_DEPLOYMENT.md", "cloud-functions/api"],
  ["docs/INFORMATION_PIPELINE.md", "Evidence Store"],
  ["docs/DATA_SOURCE_AKSHARE.md", "stock_fund_flow_concept"],
  ["docs/DATA_SOURCE_AKSHARE.md", "Python Data Service"],
  ["docs/DEVELOPMENT_HARNESS.md", "架构护栏"],
  ["docs/DEPLOYMENT.md", "AKShare Python Data Service"],
  ["docs/AI_HARNESS.md", "不确定性"],
  ["specs/0002-research-operating-system.md", "不是盯价格"],
  ["specs/0003-akshare-data-provider.md", "akshare: online"],
  ["specs/0004-capture-clean-architecture.md", "CaptureItem"],
  ["specs/0005-public-deployment-akshare.md", "AKShare 服务化"],
];

for (const [file, keyword] of contextChecks) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, "utf8");
  content.includes(keyword) ? pass(`${file} includes ${keyword}`) : fail(`${file} includes ${keyword}`, "keyword missing");
}

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? "OK" : "FAIL"} ${check.name}${check.detail ? ` - ${check.detail}` : ""}`);
}

if (failed.length) {
  console.error(`\n${failed.length} quality check(s) failed.`);
  process.exit(1);
}

console.log("\nAll quality checks passed.");

function findTestFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) return findTestFiles(file);
    return file.endsWith(".test.js") ? [file] : [];
  });
}
