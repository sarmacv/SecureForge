#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "resources/secureforge/package.json",
  "resources/secureforge/agents/secureforge.agent.md",
  "resources/secureforge/skills/secureforge-security/SKILL.md",
  "resources/secureforge/skills/secureforge-security/references/checklist.md",
  "resources/secureforge/skills/secureforge-security/references/remediation-policy.md",
  "resources/secureforge/skills/secureforge-security/scripts/collect-findings.mjs",
  "resources/secureforge/skills/secureforge-security/scripts/verify-remediation.mjs",
  "resources/secureforge/skills/secureforge-security/assets/SECURITY.template.md",
];

const missing = required.filter((path) => !existsSync(resolve(root, path)));
if (missing.length) {
  console.error(missing.map((path) => `Missing ${path}`).join("\n"));
  process.exit(1);
}

const packageVersion = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")).version;
const resourceVersion = JSON.parse(readFileSync(resolve(root, "resources/secureforge/package.json"), "utf8")).version;
if (packageVersion !== resourceVersion) {
  console.error(`Extension version ${packageVersion} does not match embedded SecureForge version ${resourceVersion}.`);
  process.exit(1);
}

console.log(`SecureForge embedded resources are valid (${required.length} files, version ${packageVersion}).`);
