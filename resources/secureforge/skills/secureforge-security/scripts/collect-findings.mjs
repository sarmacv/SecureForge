#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const targetArg = process.argv.indexOf("--target");
const root = resolve(targetArg >= 0 ? process.argv[targetArg + 1] : process.cwd());
const run = (command, args) => spawnSync(command, args, { cwd: root, encoding: "utf8" });
const git = (...args) => run("git", args);
const currentBranch = git("branch", "--show-current");
const commit = git("rev-parse", "HEAD");

if (commit.status !== 0) {
  console.error(`SecureForge collector: ${root} is not a readable Git repository.`);
  process.exit(2);
}

const files = {
  securityPolicy: existsSync(resolve(root, "SECURITY.md")),
  codeqlWorkflow: existsSync(resolve(root, ".github/workflows/codeql.yml")) || existsSync(resolve(root, ".github/workflows/codeql.yaml")),
  dependabotConfig: existsSync(resolve(root, ".github/dependabot.yml")) || existsSync(resolve(root, ".github/dependabot.yaml")),
  packageJson: existsSync(resolve(root, "package.json")),
};

let packageScripts = {};
if (files.packageJson) {
  try {
    packageScripts = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).scripts ?? {};
  } catch {
    packageScripts = { _error: "package.json could not be parsed" };
  }
}

const report = {
  schemaVersion: 1,
  repository: root,
  branch: currentBranch.stdout.trim() || null,
  commit: commit.stdout.trim(),
  dirty: git("status", "--porcelain").stdout.trim().length > 0,
  files,
  validationCommands: Object.fromEntries(
    ["lint", "typecheck", "test", "build"].filter((name) => packageScripts[name]).map((name) => [name, `npm run ${name}`]),
  ),
  notes: [
    "This collector reports repository-local evidence only.",
    "CodeQL and Dependabot alert outcomes require authorized GitHub access and must be collected separately.",
  ],
};

console.log(JSON.stringify(report, null, 2));
