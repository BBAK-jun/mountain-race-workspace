export type CountMap = Record<string, number>;
export type DocDescriptionMap = Record<string, string>;

export type PackageJsonLike = {
  exports?: Record<string, unknown>;
  name?: string;
  packageManager?: string;
  scripts?: Record<string, string>;
};

export type ApiLayers = {
  application: string[];
  domain: string[];
  infrastructure: string[];
  presentation: string[];
};

export type DocsRegistryEntry = {
  generator?: string;
  generated?: boolean;
  ignoreWatchPaths?: string[];
  kind?: string;
  lastReviewedAt?: string | null;
  watchPaths?: string[];
};

export type ManagedMarkdownFile = {
  docPath: string;
  markers: string[];
};

export type GeneratedDocument = {
  docPath: string;
  generator: string;
};

export type DocsRegistry = {
  documents?: Record<string, DocsRegistryEntry>;
  version: number;
};

export type DocStatus = "manual" | "generated" | "current" | "stale";
export type AuditStatus = DocStatus | "in-progress" | "stale-working-tree";

export type DocGovernanceStatus = {
  auditReason: string;
  auditStatus: AuditStatus;
  autoWatchPaths: string[];
  docDirtyPaths: string[];
  docPath: string;
  dri: string;
  generated: boolean;
  kind: string;
  lastReviewedAt: string | null;
  latestWatchedCommit: number | null;
  manualWatchPaths: string[];
  reason: string;
  status: DocStatus;
  watchPaths: string[];
  watchedDirtyPaths: string[];
};

export type DocGovernance = {
  auditCounts: CountMap;
  counts: CountMap;
  statuses: DocGovernanceStatus[];
};

export type WorkspaceSnapshot = {
  apiLayers: ApiLayers;
  apiPackage: PackageJsonLike;
  apiSourceFiles: string[];
  codexAgents: string[];
  codexSkills: string[];
  cursorAgents: string[];
  cursorRules: string[];
  cursorSkills: string[];
  docDescriptions: DocDescriptionMap;
  docs: string[];
  generatedDocuments: GeneratedDocument[];
  gameLogicPackage: PackageJsonLike;
  managedDocFiles: string[];
  managedMarkerDocuments: ManagedMarkdownFile[];
  rootPackage: PackageJsonLike;
  typesPackage: PackageJsonLike;
  webFeatureFiles: string[];
  webPackage: PackageJsonLike;
  webRoutes: string[];
  workflows: string[];
};

export type WorkspaceSnapshotWithGovernance = WorkspaceSnapshot & {
  docGovernance: DocGovernance;
};
