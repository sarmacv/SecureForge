---
name: secureforge-security
description: Assess and remediate repository security when SecureForge is manually invoked for a selected branch. Covers security findings, dependencies, deprecations, repository controls, and post-fix verification with explicit approval boundaries.
---

# SecureForge security assessment

Use this skill only as part of a user-requested SecureForge assessment or
remediation. Preserve repository-specific instructions and authorization
boundaries.

## Assessment

1. Record the repository, selected source branch, and exact commit. Do not
   mutate the repository during this phase.
2. Read [references/checklist.md](references/checklist.md) and determine which
   controls apply from repository evidence.
3. Collect CodeQL and Dependabot outcomes when accessible. Inspect dependency
   manifests, lockfiles, security configuration, source patterns, workflows,
   and available validation commands. The deterministic collector in
   `scripts/collect-findings.mjs` may be used for repository-local evidence.
4. Report every control as PASS, FAIL, WARNING, MANUAL REVIEW, NOT APPLICABLE,
   or UNABLE TO VERIFY. Include evidence, severity, confidence, affected
   location, and remediation availability for each issue.
5. Present the complete checklist and proposed remediations. Stop and ask
   whether the user wants specific fixes.

## Remediation

Proceed only after explicit approval. Read
[references/remediation-policy.md](references/remediation-policy.md) before
changing anything.

1. Ask for a new fix-branch name and validate that it is not the source or
   default branch. Refuse to overwrite an existing branch without separate
   explicit authorization.
2. Reconfirm that the source commit matches the assessed commit. If it changed,
   stop and require a new assessment.
3. Apply only the approved remediations. Keep unrelated files unchanged.
4. For dependency changes, examine package deprecation metadata, release and
   migration information available in the environment, compiler/type errors,
   deprecation-aware lint results, and repository tests. Do not infer that a
   successful installation proves compatibility.
5. Use `scripts/verify-remediation.mjs` when compatible with the repository, or
   run its documented validation commands directly.
6. Rerun every applicable checklist item and compare results with the initial
   assessment. A successful build is necessary when the repository defines one
   but is not sufficient by itself.
7. Present the final checklist, unresolved risks, manual reviews, changed
   files, and validation results. Do not merge automatically.

## Stopping conditions

Stop without further mutation when authorization is missing, a requested fix
is outside policy, the source commit changed, a required check cannot execute,
or the proposed changes fail required build or tests. Preserve evidence and
explain the next decision needed from the user.
