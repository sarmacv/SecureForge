# SecureForge remediation policy

The user must explicitly approve each remediation category before mutation.
Repository policies may narrow these permissions but may not silently broaden
them.

## Eligible for automated remediation after approval

- Patch dependency updates with a published fix.
- Minor dependency updates allowed by existing version constraints when build
  and tests provide meaningful coverage.
- Deterministic codemods or deprecated API replacements documented by the
  package maintainer.
- High-confidence source fixes whose behavior can be verified by existing or
  newly approved tests.
- Least-privilege reductions to workflow permissions that preserve required
  behavior.
- Deterministic security configuration corrections with clear validation.

## Manual review required

- Major framework or dependency upgrades.
- Package replacement when a dependency is abandoned or deprecated.
- Authentication, authorization, session, encryption, or key-management
  changes.
- Database or persistent-data migrations.
- Public API or schema changes.
- Architectural changes, business-logic fixes, or behavior without adequate
  tests.
- Findings with low confidence, conflicting guidance, or no available fix.

## Prohibited without separate explicit authorization

- Changing the source or default branch directly.
- Disabling, dismissing, or weakening security controls to obtain a pass.
- Printing, committing, rotating, or transmitting discovered secrets.
- Force pushing, deleting branches, bypassing branch protections, or merging.
- Expanding cloud, production, organization, or repository permissions.
- Sending repository contents to an unapproved external service.

## Completion gate

Remediation completes only when required build and tests succeed, applicable
security controls are rerun, the diff is limited to approved scope, and the
final checklist identifies every unresolved risk. A passing build alone is not
evidence that the remediation is secure or behaviorally correct.
