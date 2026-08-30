import * as crypto from "node:crypto";
import * as vscode from "vscode";
import { INSTALLATION_STATE, PACKAGE_FILES } from "./packageFiles.js";
import type { FileStatus, InstallationState } from "./types.js";

export function hash(content: Uint8Array): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function readIfPresent(uri: vscode.Uri): Promise<Uint8Array | undefined> {
  try {
    return await vscode.workspace.fs.readFile(uri);
  } catch (error) {
    if (error instanceof vscode.FileSystemError && error.code === "FileNotFound") return undefined;
    throw error;
  }
}

export async function readState(root: vscode.Uri): Promise<InstallationState | undefined> {
  const content = await readIfPresent(vscode.Uri.joinPath(root, INSTALLATION_STATE));
  if (!content) return undefined;
  try {
    return JSON.parse(new TextDecoder().decode(content)) as InstallationState;
  } catch {
    throw new Error(`${INSTALLATION_STATE} is not valid JSON.`);
  }
}

export async function inspectFiles(
  context: vscode.ExtensionContext,
  root: vscode.Uri,
): Promise<FileStatus[]> {
  const state = await readState(root);
  const previous = new Map(state?.files.map((file) => [file.path, file.sha256]) ?? []);
  const statuses: FileStatus[] = [];
  for (const file of PACKAGE_FILES) {
    const packaged = await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(context.extensionUri, "resources", "secureforge", file.source),
    );
    const installed = await readIfPresent(vscode.Uri.joinPath(root, file.target));
    const packagedHash = hash(packaged);
    const installedHash = installed ? hash(installed) : undefined;
    const stateValue = !installed
      ? "missing"
      : installedHash === packagedHash
        ? "current"
        : previous.get(file.target) === installedHash
          ? "outdated"
          : "modified";
    statuses.push({ ...file, state: stateValue });
  }
  return statuses;
}

export async function writePackage(
  context: vscode.ExtensionContext,
  root: vscode.Uri,
  allowedTargets: Set<string>,
): Promise<void> {
  const manifest = JSON.parse(
    new TextDecoder().decode(
      await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri, "resources", "secureforge", "package.json")),
    ),
  ) as { version: string };
  const installed = [];
  for (const file of PACKAGE_FILES) {
    const source = vscode.Uri.joinPath(context.extensionUri, "resources", "secureforge", file.source);
    const destination = vscode.Uri.joinPath(root, file.target);
    if (allowedTargets.has(file.target)) {
      const content = await vscode.workspace.fs.readFile(source);
      await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(destination, ".."));
      await vscode.workspace.fs.writeFile(destination, content);
    }
    const finalContent = await readIfPresent(destination);
    if (finalContent) installed.push({ path: file.target, sha256: hash(finalContent) });
  }
  const state: InstallationState = {
    schemaVersion: 1,
    version: manifest.version,
    installedAt: new Date().toISOString(),
    files: installed,
  };
  await vscode.workspace.fs.writeFile(
    vscode.Uri.joinPath(root, INSTALLATION_STATE),
    new TextEncoder().encode(`${JSON.stringify(state, null, 2)}\n`),
  );
}

export async function removeFile(uri: vscode.Uri): Promise<void> {
  try {
    await vscode.workspace.fs.delete(uri, { useTrash: false });
  } catch (error) {
    if (!(error instanceof vscode.FileSystemError && error.code === "FileNotFound")) throw error;
  }
}
