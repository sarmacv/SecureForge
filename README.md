# SecureForge for VS Code

SecureForge for VS Code installs and manages the SecureForge GitHub Copilot
custom agent in the currently opened Git repository.

## Commands

- **SecureForge: Open Setup** opens the guided setup interface.
- **SecureForge: Preview Installation** shows every file that would be added.
- **SecureForge: Check Prerequisites** reports CodeQL, Dependabot,
  `SECURITY.md`, package manifests, and validation commands.
- **SecureForge: Install** writes the agent and skill after confirmation.
- **SecureForge: Validate Installation** detects missing or locally modified
  SecureForge files.
- **SecureForge: Update** updates unmodified files and asks before replacing
  local customizations.
- **SecureForge: Uninstall** removes only unchanged files installed by the
  extension; modified files are preserved unless explicitly approved.

Installation never creates or changes CodeQL, Dependabot, or `SECURITY.md`
configuration. Those remain repository-owned integrations.

## Development

The extension contains a versioned SecureForge core bundle under
`resources/secureforge/`, so the repository builds independently. From this
directory:

```bash
npm install
npm run validate:resources
npm run check
```

Press **F5** in VS Code to launch an Extension Development Host.

## Security

The extension does not collect telemetry, request a GitHub token, transmit
repository contents, or execute repository code during installation. Repository
mutations require a trusted workspace and explicit confirmation.
