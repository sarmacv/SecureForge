# SecureForge VS Code extension guide

## Purpose

The SecureForge VS Code extension is the installation and lifecycle interface
for the SecureForge GitHub Copilot custom agent. The extension does not perform
the agent's security assessment itself. It installs the agent profile and skill
into the current repository, detects prerequisites, protects local
customizations during updates, and removes only tracked files during uninstall.

## Experience

Run **SecureForge: Open Setup** from the Command Palette. The setup panel guides
the user through:

1. Checking repository prerequisites.
2. Preparing optional missing CodeQL, Dependabot, and `SECURITY.md` files.
3. Previewing the exact files to be installed.
4. Installing SecureForge after confirmation.
5. Validating file integrity and version.
6. Updating or uninstalling safely.

After installation and commit, the user opens GitHub Copilot Chat and manually
selects SecureForge. The agent conversation is hosted by Copilot Chat; the
extension remains the setup and maintenance surface.

## Architecture

```text
SecureForge core package
        │
        ├── agent profile
        ├── security skill
        ├── checklist and policy
        └── deterministic helpers
                 │
                 ▼ packaged by
SecureForge VS Code extension
        │
        ├── guided setup panel
        ├── prerequisite detection
        ├── safe file installation
        ├── integrity validation
        ├── conflict-aware updates
        └── tracked uninstall
                 │
                 ▼ installs into
Target repository `.github/`
                 │
                 ▼ used through
GitHub Copilot Chat → SecureForge
```

The extension includes a versioned core bundle under `resources/secureforge/`.
The resource validator requires the extension and embedded core versions to
match, allowing this repository to build and publish independently.

## Safety boundaries

- Installation and mutation require a trusted VS Code workspace.
- Every repository write requires confirmation.
- Existing SecureForge files are never overwritten during initial install.
- Updates distinguish packaged, outdated, and locally modified files.
- Uninstall preserves modified files unless the user explicitly removes them.
- CodeQL, Dependabot, and `SECURITY.md` remain repository-owned.
- Missing prerequisite templates are opt-in, previewable, and excluded from
  SecureForge uninstall.
- No telemetry, GitHub token, or external network call is required.
- The extension does not run project build or test commands during installation.

## Incremental-development map

| Area | Source |
|---|---|
| Command registration | `src/extension.ts` |
| Guided setup UI | `src/setupPanel.ts` |
| Workspace and trust checks | `src/workspace.ts` |
| Install/update/uninstall mechanics | `src/fileService.ts` |
| Package file inventory | `src/packageFiles.ts` |
| Installation-state types | `src/types.ts` |
| Bundled resource validation | `scripts/validate-resources.mjs` |
| Extension manifest and commands | `package.json` |

Recommended incremental enhancements:

1. Add a persistent Activity Bar view and repository-readiness state.
2. Add explicit GitHub authentication for optional remote-settings checks.
3. Add language-aware CodeQL and Dependabot template generation.
4. Add a reviewed `SECURITY.md` template wizard.
5. Add an **Open SecureForge Chat** handoff when the supported Copilot command
   surface is stable.
6. Add extension-host integration tests on Windows, macOS, and Linux.

## Installation for users

### Development VSIX

Build the extension:

```bash
npm install
npm run package
```

Install the generated `.vsix`:

1. Open VS Code.
2. Open the Extensions view.
3. Select the **…** menu.
4. Choose **Install from VSIX…**.
5. Select the generated SecureForge `.vsix` file.
6. Open a trusted Git repository.
7. Run **SecureForge: Open Setup**.

### Extension Development Host

1. Open `secureforge-vscode/` in VS Code.
2. Install development dependencies.
3. Run `npm run compile`.
4. Press **F5**.
5. In the new Extension Development Host, open a test Git repository.
6. Run **SecureForge: Open Setup**.

### Marketplace release

Before publishing, replace the placeholder `publisher` in `package.json` with a
verified Visual Studio Marketplace publisher, add branding assets, complete
cross-platform tests, package with `@vscode/vsce`, and review the final VSIX
contents. Publishing credentials must remain outside the repository.

## Installed repository files

```text
.github/
├── agents/
│   └── secureforge.agent.md
├── skills/
│   └── secureforge-security/
│       ├── SKILL.md
│       ├── references/
│       │   ├── checklist.md
│       │   └── remediation-policy.md
│       └── scripts/
│           ├── collect-findings.mjs
│           └── verify-remediation.mjs
└── secureforge.json
```

`secureforge.json` records the installed package version and file hashes. It
allows validation, update, and uninstall to preserve repository-specific edits.
