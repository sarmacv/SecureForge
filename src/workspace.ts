import * as vscode from "vscode";

export async function selectWorkspace(): Promise<vscode.WorkspaceFolder | undefined> {
  const folders = vscode.workspace.workspaceFolders ?? [];
  if (!folders.length) {
    void vscode.window.showErrorMessage("Open a Git repository before using SecureForge.");
    return undefined;
  }
  if (folders.length === 1) return folders[0];
  return vscode.window.showWorkspaceFolderPick({ placeHolder: "Select the repository for SecureForge" });
}

export async function requireTrustedWorkspace(): Promise<boolean> {
  if (vscode.workspace.isTrusted) return true;
  const choice = await vscode.window.showWarningMessage(
    "SecureForge can change repository files only in a trusted workspace.",
    "Manage Workspace Trust",
  );
  if (choice === "Manage Workspace Trust") {
    await vscode.commands.executeCommand("workbench.trust.manage");
  }
  return false;
}

export async function isGitRoot(root: vscode.Uri): Promise<boolean> {
  try {
    const stat = await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, ".git"));
    return stat.type === vscode.FileType.Directory || stat.type === vscode.FileType.File;
  } catch {
    return false;
  }
}
