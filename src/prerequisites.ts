import * as vscode from "vscode";

async function exists(root: vscode.Uri, path: string): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, path));
    return true;
  } catch {
    return false;
  }
}

async function hasMatch(root: vscode.Uri, pattern: string): Promise<boolean> {
  const matches = await vscode.workspace.findFiles(new vscode.RelativePattern(root, pattern), "**/{node_modules,vendor,dist,build,.git}/**", 1);
  return matches.length > 0;
}

async function detectCodeqlLanguages(root: vscode.Uri): Promise<string[]> {
  const candidates: Array<[string, string]> = [
    ["javascript-typescript", "**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    ["python", "**/*.py"],
    ["java-kotlin", "**/*.{java,kt,kts}"],
    ["csharp", "**/*.cs"],
    ["cpp", "**/*.{c,cc,cpp,cxx,h,hpp}"],
    ["go", "**/*.go"],
    ["ruby", "**/*.rb"],
    ["rust", "**/*.rs"],
  ];
  const detected: string[] = [];
  for (const [language, pattern] of candidates) {
    if (await hasMatch(root, pattern)) detected.push(language);
  }
  return detected;
}

async function detectEcosystems(root: vscode.Uri): Promise<Array<{ ecosystem: string; directory: string }>> {
  const candidates: Array<[string, string]> = [
    ["npm", "package.json"],
    ["pip", "requirements.txt"],
    ["pip", "pyproject.toml"],
    ["maven", "pom.xml"],
    ["gradle", "build.gradle"],
    ["gradle", "build.gradle.kts"],
    ["nuget", "*.csproj"],
    ["gomod", "go.mod"],
    ["bundler", "Gemfile"],
    ["cargo", "Cargo.toml"],
    ["docker", "Dockerfile"],
  ];
  const found = new Map<string, { ecosystem: string; directory: string }>();
  for (const [ecosystem, manifest] of candidates) {
    if (await hasMatch(root, `**/${manifest}`)) found.set(ecosystem, { ecosystem, directory: "/" });
  }
  found.set("github-actions", { ecosystem: "github-actions", directory: "/" });
  return [...found.values()];
}

function codeqlWorkflow(languages: string[]): string {
  const languageList = languages.map((language) => `          - ${language}`).join("\n");
  return `name: CodeQL

on:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  analyze:
    name: Analyze \${{ matrix.language }}
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      packages: read
    strategy:
      fail-fast: false
      matrix:
        language:
${languageList}
    steps:
      - uses: actions/checkout@v7
      - uses: github/codeql-action/init@v4
        with:
          languages: \${{ matrix.language }}
      - uses: github/codeql-action/autobuild@v4
      - uses: github/codeql-action/analyze@v4
`;
}

function dependabotConfig(ecosystems: Array<{ ecosystem: string; directory: string }>): string {
  const entries = ecosystems.map(({ ecosystem, directory }) => `  - package-ecosystem: ${ecosystem}
    directory: ${directory}
    schedule:
      interval: weekly
    open-pull-requests-limit: 5`).join("\n");
  return `version: 2\nupdates:\n${entries}\n`;
}

async function previewDocument(title: string, content: string, language: string): Promise<void> {
  const document = await vscode.workspace.openTextDocument({ content, language });
  await vscode.window.showTextDocument(document, { preview: true, preserveFocus: false });
  void vscode.window.setStatusBarMessage(`SecureForge preview: ${title}`, 5000);
}

export async function prepareMissingPrerequisites(context: vscode.ExtensionContext, root: vscode.Uri): Promise<void> {
  const missingCodeql = !(await exists(root, ".github/workflows/codeql.yml")) && !(await exists(root, ".github/workflows/codeql.yaml"));
  const missingDependabot = !(await exists(root, ".github/dependabot.yml")) && !(await exists(root, ".github/dependabot.yaml"));
  const missingSecurity = !(await exists(root, "SECURITY.md")) && !(await exists(root, ".github/SECURITY.md")) && !(await exists(root, "docs/SECURITY.md"));

  const available: Array<{ label: string; path: string; content: string; language: string }> = [];
  if (missingCodeql) {
    const languages = await detectCodeqlLanguages(root);
    if (languages.length) available.push({ label: `CodeQL (${languages.join(", ")})`, path: ".github/workflows/codeql.yml", content: codeqlWorkflow(languages), language: "yaml" });
  }
  if (missingDependabot) {
    const ecosystems = await detectEcosystems(root);
    available.push({ label: `Dependabot (${ecosystems.map((item) => item.ecosystem).join(", ")})`, path: ".github/dependabot.yml", content: dependabotConfig(ecosystems), language: "yaml" });
  }
  if (missingSecurity) {
    const template = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri, "resources", "secureforge", "skills", "secureforge-security", "assets", "SECURITY.template.md"));
    available.push({ label: "SECURITY.md template", path: "SECURITY.md", content: new TextDecoder().decode(template), language: "markdown" });
  }

  if (!available.length) {
    void vscode.window.showInformationMessage("CodeQL, Dependabot, and SECURITY.md repository files are already present, or CodeQL language detection needs manual configuration.");
    return;
  }

  const selected = await vscode.window.showQuickPick(
    available.map((item) => ({ label: item.label, description: item.path, item, picked: true })),
    { canPickMany: true, placeHolder: "Select missing prerequisites to prepare" },
  );
  if (!selected?.length) return;

  const action = await vscode.window.showInformationMessage(
    `Prepare ${selected.length} repository-owned prerequisite file(s)? You will review and commit them normally.`,
    { modal: true },
    "Preview First",
    "Create Files",
  );
  if (!action) return;
  if (action === "Preview First") {
    for (const choice of selected) await previewDocument(choice.item.label, choice.item.content, choice.item.language);
    void vscode.window.showInformationMessage("Prerequisite previews opened. Run SecureForge: Prepare Missing Prerequisites again to create them.");
    return;
  }

  for (const choice of selected) {
    const destination = vscode.Uri.joinPath(root, choice.item.path);
    await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(destination, ".."));
    await vscode.workspace.fs.writeFile(destination, new TextEncoder().encode(choice.item.content));
  }
  void vscode.window.showInformationMessage("SecureForge prepared the selected prerequisite files. Review their triggers, permissions, schedules, and policy placeholders before committing.");
}
