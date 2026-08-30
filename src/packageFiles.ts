import type { PackageFile } from "./types.js";

export const PACKAGE_FILES: PackageFile[] = [
  { source: "agents/secureforge.agent.md", target: ".github/agents/secureforge.agent.md" },
  { source: "skills/secureforge-security/SKILL.md", target: ".github/skills/secureforge-security/SKILL.md" },
  { source: "skills/secureforge-security/references/checklist.md", target: ".github/skills/secureforge-security/references/checklist.md" },
  { source: "skills/secureforge-security/references/remediation-policy.md", target: ".github/skills/secureforge-security/references/remediation-policy.md" },
  { source: "skills/secureforge-security/scripts/collect-findings.mjs", target: ".github/skills/secureforge-security/scripts/collect-findings.mjs" },
  { source: "skills/secureforge-security/scripts/verify-remediation.mjs", target: ".github/skills/secureforge-security/scripts/verify-remediation.mjs" },
];

export const INSTALLATION_STATE = ".github/secureforge.json";
