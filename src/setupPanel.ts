import * as vscode from "vscode";

function nonce(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length: 32 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function openSetupPanel(context: vscode.ExtensionContext): void {
  const panel = vscode.window.createWebviewPanel(
    "secureforgeSetup",
    "SecureForge Setup",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true },
  );
  const token = nonce();
  panel.webview.html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource} 'nonce-${token}'; script-src 'nonce-${token}';">
  <title>SecureForge Setup</title>
  <style nonce="${token}">
    :root { color-scheme: light dark; }
    body { color: var(--vscode-foreground); background: var(--vscode-editor-background); font-family: var(--vscode-font-family); margin: 0; }
    main { max-width: 880px; margin: 0 auto; padding: 44px 36px 72px; }
    .eyebrow { color: var(--vscode-descriptionForeground); font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { font-size: 34px; line-height: 1.12; margin: 12px 0; }
    .intro { color: var(--vscode-descriptionForeground); font-size: 16px; line-height: 1.55; max-width: 680px; }
    .rule { border-top: 1px solid var(--vscode-panel-border); margin: 32px 0; }
    .step { display: grid; grid-template-columns: 44px 1fr auto; gap: 16px; align-items: center; padding: 18px 0; border-bottom: 1px solid var(--vscode-panel-border); }
    .number { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid var(--vscode-focusBorder); color: var(--vscode-focusBorder); border-radius: 50%; font-weight: 700; }
    .step h2 { font-size: 17px; margin: 0 0 5px; }
    .step p { color: var(--vscode-descriptionForeground); margin: 0; line-height: 1.4; }
    button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 0; border-radius: 2px; cursor: pointer; padding: 8px 13px; font: inherit; }
    button:hover { background: var(--vscode-button-hoverBackground); }
    button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .principles { margin-top: 34px; padding: 20px 22px; background: var(--vscode-textBlockQuote-background); border-left: 3px solid var(--vscode-focusBorder); }
    .principles strong { display: block; margin-bottom: 8px; }
    .principles ul { margin: 0; padding-left: 20px; color: var(--vscode-descriptionForeground); line-height: 1.6; }
    @media (max-width: 680px) { .step { grid-template-columns: 38px 1fr; } .step button { grid-column: 2; justify-self: start; } }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">Assess. Remediate. Verify.</div>
    <h1>Prepare this repository for SecureForge</h1>
    <p class="intro">Use this guided setup to inspect repository readiness, preview the package, install the custom agent, and verify its integrity. Every repository change remains visible and reviewable.</p>
    <div class="rule"></div>
    <section class="step"><div class="number">1</div><div><h2>Check prerequisites</h2><p>Detect Git, CodeQL, Dependabot, security policy, and package ecosystems.</p></div><button data-command="secureforge.checkPrerequisites">Run check</button></section>
    <section class="step"><div class="number">2</div><div><h2>Prepare missing prerequisites</h2><p>Preview optional, repository-owned CodeQL, Dependabot, and SECURITY.md starter files.</p></div><button class="secondary" data-command="secureforge.preparePrerequisites">Prepare</button></section>
    <section class="step"><div class="number">3</div><div><h2>Preview installation</h2><p>See the exact agent and skill files SecureForge will add or update.</p></div><button class="secondary" data-command="secureforge.preview">Preview files</button></section>
    <section class="step"><div class="number">4</div><div><h2>Install SecureForge</h2><p>Add the manually invoked custom agent and its security skill after confirmation.</p></div><button data-command="secureforge.install">Install</button></section>
    <section class="step"><div class="number">5</div><div><h2>Validate integrity</h2><p>Confirm installed files are current and identify local customizations.</p></div><button class="secondary" data-command="secureforge.validate">Validate</button></section>
    <section class="step"><div class="number">6</div><div><h2>Maintain the installation</h2><p>Update safely or remove only files tracked by SecureForge.</p></div><div><button class="secondary" data-command="secureforge.update">Update</button> <button class="secondary" data-command="secureforge.uninstall">Uninstall</button></div></section>
    <div class="principles"><strong>Secure by design</strong><ul><li>No telemetry or repository-content transmission.</li><li>No GitHub token required for local installation.</li><li>No silent changes to CodeQL, Dependabot, or SECURITY.md.</li><li>Workspace Trust and confirmation required before repository writes.</li></ul></div>
  </main>
  <script nonce="${token}">
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('[data-command]').forEach((button) => {
      button.addEventListener('click', () => vscode.postMessage({ command: button.dataset.command }));
    });
  </script>
</body>
</html>`;
  panel.webview.onDidReceiveMessage(
    async (message: { command?: string }) => {
      if (typeof message.command === "string" && message.command.startsWith("secureforge.")) {
        await vscode.commands.executeCommand(message.command);
      }
    },
    undefined,
    context.subscriptions,
  );
}
