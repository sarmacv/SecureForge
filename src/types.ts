export interface InstalledFile {
  path: string;
  sha256: string;
}

export interface InstallationState {
  schemaVersion: 1;
  version: string;
  installedAt: string;
  files: InstalledFile[];
}

export interface PackageFile {
  source: string;
  target: string;
}

export interface FileStatus extends PackageFile {
  state: "missing" | "current" | "modified" | "outdated";
}
