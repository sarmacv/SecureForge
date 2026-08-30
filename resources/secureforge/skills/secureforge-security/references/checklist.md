# SecureForge checklist

Use only controls supported by evidence in the selected repository. Mark a
control NOT APPLICABLE when the relevant technology is absent and UNABLE TO
VERIFY when it applies but cannot run or lacks access.

## Readiness

- Source branch exists and exact commit is recorded.
- Repository instructions and `SECURITY.md` are identified.
- Required GitHub alert access is available.
- Install, lint, type-check, test, and build commands are identified.
- Required scanners are configured and their results correspond to the
  selected commit or are clearly labeled otherwise.

## Application code

- Open CodeQL/code-scanning findings.
- Injection, unsafe data flow, dangerous file/command operations, weak
  cryptography, and sensitive logging findings supported by available static
  analysis.
- Authentication, authorization, and business-logic concerns requiring manual
  review.
- High-confidence secret patterns and GitHub secret-scanning results when
  available. Never print discovered secret values.

## Dependencies and supply chain

- Open Dependabot alerts.
- Vulnerable direct and transitive dependencies.
- Deprecated packages and unavailable maintainers/replacements.
- Deprecated or removed APIs affected by proposed upgrades.
- Outdated dependencies, distinguishing patch/minor from major upgrades.
- Lockfile presence and consistency.
- GitHub Actions dependencies and unsafe mutable references.
- Malicious-package, license, SBOM, signing, and provenance controls when
  configured.

## Repository and delivery controls

- CodeQL and Dependabot configuration presence and accessibility.
- Workflow permissions follow least privilege.
- Untrusted pull-request code cannot obtain write tokens or protected secrets.
- Security reporting policy exists and provides a private reporting route.
- CODEOWNERS, protected environments, and branch rules when accessible.

## Technology-dependent controls

- Container image and base-image findings when container files exist.
- Infrastructure-as-code findings when IaC files exist.
- Kubernetes workload and RBAC findings when manifests exist.
- API and dynamic testing only when a safe test target and authorization exist.
- Cloud posture and runtime controls only with explicitly authorized access.

## Verification

- Dependency installation is reproducible.
- Formatting, lint, type checking, unit tests, integration tests, and build run
  when defined by the repository.
- Applicable security checks are rerun after fixes.
- The final diff contains only approved changes.
- No new blocking security findings were introduced.

## Overall decision

- FAIL when a blocking finding remains or a required validation fails.
- CONDITIONAL PASS when no blocking finding remains but warnings, manual
  reviews, or unavailable non-blocking checks remain.
- PASS only when every applicable required check ran successfully and no
  blocking finding remains.
- Never state that the product is completely secure. State that all configured
  and successfully executed controls passed.
