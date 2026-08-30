import * as vscode from "vscode";
import { INSTALLATION_STATE, PACKAGE_FILES } from "./packageFiles.js";
import { inspectFiles, readState, removeFile, writePackage } from "./fileService.js";
import { isGitRoot, requireTrustedWorkspace, selectWorkspace } from "./workspace.js";
import { openSetupPanel } from "./setupPanel.js";
import { prepareMissingPrerequisites } from "./prerequisites.js";

const output = vscode.window.createOutputChannel("SecureForge");

async function withRepository(action: (folder: vscode.WorkspaceFolder) => Promise<void>): Promise<void> {
  const folder = await selectWorkspace();
  if (!folder) return;
  if (!(await isGitRoot(folder.uri))) {
    void vscode.window.showErrorMessage("SecureForge requires the selected workspace folder to be a Git repository root.");
    return;
  }
  await action(folder);
}

function showLines(title: string, lines: string[]): void {
  output.clear();
  output.appendLine(title);
  output.appendLine("=".repeat(title.length));
  for (const line of lines) output.appendLine(line);
  output.show(true);
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

async function preview(context: vscode.ExtensionContext): Promise<void> {
  await withRepository(async (folder) => {
    const statuses = await inspectFiles(context, folder.uri);
    showLines("SecureForge installation preview", statuses.map((file) => `${file.state.padEnd(9)} ${file.target}`));
  });
}

async function prerequisites(): Promise<void> {
  await withRepository(async (folder) => {
    const checks: Array<[string, string[]]> = [
      ["CodeQL workflow", [".github/workflows/codeql.yml", ".github/workflows/codeql.yaml"]],
      ["Dependabot configuration", [".github/dependabot.yml", ".github/dependabot.yaml"]],
      ["Security policy", ["SECURITY.md", ".github/SECURITY.md", "docs/SECURITY.md"]],
      ["Node package manifest", ["package.json"]],
      ["Python package manifest", ["pyproject.toml", "requirements.txt"]],
      ["Java package manifest", ["pom.xml", "build.gradle", "build.gradle.kts"]],
      ["Go package manifest", ["go.mod"]],
      ["Rust package manifest", ["Cargo.toml"]],
    ];
    const results = [];
    for (const [label, candidates] of checks) {
      const present = (await Promise.all(candidates.map((path) => exists(vscode.Uri.joinPath(folder.uri, path))))).some(Boolean);
      results.push(`${present ? "PASS   " : "MISSING"} ${label}`);
    }
    showLines("SecureForge prerequisites", results);
  });
}

async function installOrUpdate(context: vscode.ExtensionContext, update: boolean): Promise<void> {
  await withRepository(async (folder) => {
    if (!(await requireTrustedWorkspace())) return;
    const statuses = await inspectFiles(context, folder.uri);
    const modified = statuses.filter((file) => file.state === "modified");
    const eligible = statuses.filter((file) => file.state === "missing" || file.state === "outdated");
    if (!update && statuses.some((file) => file.state !== "missing")) {
      void vscode.window.showWarningMessage("SecureForge is already partly or fully installed. Use SecureForge: Update.");
      return;
    }
    if (update && modified.length) {
      const decision = await vscode.window.showWarningMessage(
        `${modified.length} SecureForge file(s) contain local changes. Preserve them or replace them with the packaged version?`,
        { modal: true },
        "Preserve",
        "Replace",
      );
      if (!decision) return;
      if (decision === "Replace") eligible.push(...modified);
    }
    if (!eligible.length) {
      void vscode.window.showInformationMessage("SecureForge is already current.");
      return;
    }
    const confirmation = await vscode.window.showInformationMessage(
      `${update ? "Update" : "Install"} ${eligible.length} SecureForge file(s) in ${folder.name}?`,
      { modal: true },
      update ? "Update" : "Install",
    );
    if (!confirmation) return;
    await writePackage(context, folder.uri, new Set(eligible.map((file) => file.target)));
    void vscode.window.showInformationMessage(`SecureForge ${update ? "updated" : "installed"}. Review and commit the repository changes.`);
  });
}

async function validate(context: vscode.ExtensionContext): Promise<void> {
  await withRepository(async (folder) => {
    const statuses = await inspectFiles(context, folder.uri);
    const state = await readState(folder.uri);
    showLines("SecureForge installation validation", [
      `Installation record: ${state ? `version ${state.version}` : "missing"}`,
      ...statuses.map((file) => `${file.state.toUpperCase().padEnd(9)} ${file.target}`),
    ]);
  });
}

async function uninstall(context: vscode.ExtensionContext): Promise<void> {
  await withRepository(async (folder) => {
    if (!(await requireTrustedWorkspace())) return;
    const statuses = await inspectFiles(context, folder.uri);
    const modified = statuses.filter((file) => file.state === "modified");
    const removable = statuses.filter((file) => file.state === "current" || file.state === "outdated");
    let removeModified = false;
    if (modified.length) {
      const decision = await vscode.window.showWarningMessage(
        `${modified.length} SecureForge file(s) contain local changes and will be preserved unless you explicitly remove them.`,
        { modal: true },
        "Preserve Changes",
        "Remove All",
      );
      if (!decision) return;
      removeModified = decision === "Remove All";
    }
    const confirmation = await vscode.window.showWarningMessage(
      `Remove SecureForge from ${folder.name}? Repository-owned CodeQL, Dependabot, and SECURITY.md files will not be changed.`,
      { modal: true },
      "Uninstall",
    );
    if (!confirmation) return;
    for (const file of [...removable, ...(removeModified ? modified : [])]) {
      await removeFile(vscode.Uri.joinPath(folder.uri, file.target));
    }
    await removeFile(vscode.Uri.joinPath(folder.uri, INSTALLATION_STATE));
    void vscode.window.showInformationMessage(
      modified.length && !removeModified ? "SecureForge uninstalled; locally modified files were preserved." : "SecureForge uninstalled.",
    );
  });
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    output,
    vscode.commands.registerCommand("secureforge.openSetup", () => openSetupPanel(context)),
    vscode.commands.registerCommand("secureforge.preview", () => preview(context)),
    vscode.commands.registerCommand("secureforge.checkPrerequisites", prerequisites),
    vscode.commands.registerCommand("secureforge.preparePrerequisites", () => withRepository(async (folder) => {
      if (await requireTrustedWorkspace()) await prepareMissingPrerequisites(context, folder.uri);
    })),
    vscode.commands.registerCommand("secureforge.install", () => installOrUpdate(context, false)),
    vscode.commands.registerCommand("secureforge.update", () => installOrUpdate(context, true)),
    vscode.commands.registerCommand("secureforge.validate", () => validate(context)),
    vscode.commands.registerCommand("secureforge.uninstall", () => uninstall(context)),
  );
}

export function deactivate(): void {}
