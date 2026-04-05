import type { DocsRegistry, PackageJsonLike, WorkspaceSnapshot } from "./types.mts";

import {
  collectDocDescriptions,
  collectGeneratedDocuments,
  discoverPublishedDocumentPaths,
  discoverManagedMarkerDocuments,
} from "./documents.mts";
import { listDirectories, listFiles, readJson } from "./repo.mts";
import { sortStrings } from "./utils.mts";

export function formatScripts(packageJson: PackageJsonLike) {
  return Object.entries(packageJson.scripts ?? {}).map(
    ([name, command]) => `- \`${name}\`: \`${command}\``,
  );
}

export async function collectWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const rootPackage = await readJson<PackageJsonLike>("package.json");
  const webPackage = await readJson<PackageJsonLike>("apps/web/package.json");
  const apiPackage = await readJson<PackageJsonLike>("apps/api/package.json");
  const gameLogicPackage = await readJson<PackageJsonLike>("packages/game-logic/package.json");
  const typesPackage = await readJson<PackageJsonLike>("packages/types/package.json");
  const docsRegistry = await readJson<DocsRegistry>("docs/docs-registry.json");
  const managedMarkerDocuments = await discoverManagedMarkerDocuments();
  const generatedDocuments = collectGeneratedDocuments(docsRegistry);
  const generatedDocFiles = generatedDocuments.map((document) => document.docPath);
  const docs = await discoverPublishedDocumentPaths(docsRegistry);
  const docDescriptions = await collectDocDescriptions(docs);
  const managedDocFiles = sortStrings(
    Array.from(
      new Set([...managedMarkerDocuments.map((item) => item.docPath), ...generatedDocFiles]),
    ),
  );
  const workflows = await listFiles(".github/workflows", (file) => file.endsWith(".yml"));
  const cursorRules = await listFiles(".cursor/rules", (file) => file.endsWith(".mdc"));
  const cursorSkills = await listDirectories(".cursor/skills");
  const cursorAgents = await listFiles(".cursor/agents", (file) => file.endsWith(".md"));
  const codexSkills = await listDirectories(".agents/skills", (name) => name !== "AGENTS.md");
  const codexAgents = await listFiles(".codex/agents", (file) => file.endsWith(".toml"));
  const webRoutes = await listFiles("apps/web/src/routes", (file) => file.endsWith(".tsx"));
  const webFeatureFiles = await listFiles(
    "apps/web/src/features",
    (file) => file.endsWith(".ts") || file.endsWith(".tsx"),
  );
  const apiSourceFiles = await listFiles(
    "apps/api/src",
    (file) => file.endsWith(".ts") || file.endsWith(".tsx"),
  );

  const apiLayers = {
    domain: apiSourceFiles.filter((file) => file.startsWith("apps/api/src/domain/")),
    application: apiSourceFiles.filter((file) => file.startsWith("apps/api/src/application/")),
    infrastructure: apiSourceFiles.filter((file) =>
      file.startsWith("apps/api/src/infrastructure/"),
    ),
    presentation: apiSourceFiles.filter((file) => file.startsWith("apps/api/src/presentation/")),
  };

  return {
    rootPackage,
    webPackage,
    apiPackage,
    gameLogicPackage,
    typesPackage,
    docDescriptions,
    docs,
    generatedDocuments,
    managedDocFiles,
    managedMarkerDocuments,
    workflows,
    cursorRules,
    cursorSkills,
    cursorAgents,
    codexSkills,
    codexAgents,
    webRoutes,
    webFeatureFiles,
    apiSourceFiles,
    apiLayers,
  };
}
