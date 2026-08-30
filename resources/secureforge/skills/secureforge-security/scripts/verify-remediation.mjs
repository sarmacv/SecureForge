#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const targetArg = process.argv.indexOf("--target");
const root = resolve(targetArg >= 0 ? process.argv[targetArg + 1] : process.cwd());
const packagePath = resolve(root, "package.json");

if (!existsSync(packagePath)) {
  console.error("SecureForge verification: no package.json found; use the repository's documented validation commands.");
  process.exit(2);
}

let packageJson;
try {
  packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
} catch {
  console.error("SecureForge verification: package.json could not be parsed.");
  process.exit(2);
}

const requested = ["lint", "typecheck", "test", "build"];
const commands = requested.filter((name) => packageJson.scripts?.[name]);
if (!commands.length) {
  console.error("SecureForge verification: no lint, typecheck, test, or build scripts are defined.");
  process.exit(2);
}

const results = [];
for (const name of commands) {
  const result = spawnSync("npm", ["run", name], { cwd: root, encoding: "utf8", stdio: "inherit" });
  results.push({ check: name, status: result.status === 0 ? "PASS" : "FAIL" });
}

console.log(JSON.stringify({ schemaVersion: 1, repository: root, results }, null, 2));
process.exitCode = results.some((result) => result.status === "FAIL") ? 1 : 0;
