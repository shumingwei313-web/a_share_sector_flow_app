import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const rules = [
  {
    name: "domain must not depend on outer layers",
    dir: "src/domain",
    forbidden: ["../application", "../infrastructure", "../interfaces", "fetch(", "node:http", "node:fs", "node:child_process"],
  },
  {
    name: "application must not depend on infrastructure or interfaces",
    dir: "src/application",
    forbidden: ["../infrastructure", "../interfaces", "fetch(", "node:http"],
  },
  {
    name: "interfaces must not import data sources directly",
    dir: "src/interfaces",
    forbidden: ["../../infrastructure/data-sources/akshare", "../../infrastructure/data-sources/eastmoney"],
  },
];

const failures = [];

for (const rule of rules) {
  if (!existsSync(rule.dir)) continue;
  for (const file of walk(rule.dir)) {
    const content = readFileSync(file, "utf8");
    for (const token of rule.forbidden) {
      if (content.includes(token)) {
        failures.push(`${rule.name}: ${relative(process.cwd(), file)} contains ${token}`);
      }
    }
  }
}

if (failures.length) {
  console.error(failures.map((failure) => `FAIL ${failure}`).join("\n"));
  process.exit(1);
}

console.log("OK architecture dependency guards");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) return walk(file);
    return file.endsWith(".js") ? [file] : [];
  });
}
