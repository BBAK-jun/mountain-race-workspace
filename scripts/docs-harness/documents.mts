import path from "node:path";

import { listFiles, readText } from "./repo.mts";
import type { DocsRegistry, GeneratedDocument, ManagedMarkdownFile } from "./types.mts";
import { sortStrings } from "./utils.mts";

const managedSectionPattern = /<!-- docs-harness:([a-z0-9-]+):start -->/g;
const managedSectionBlockPattern =
  /<!-- docs-harness:[a-z0-9-]+:start -->[\s\S]*?<!-- docs-harness:[a-z0-9-]+:end -->/g;
const ignoredDirectorySegments = new Set(["coverage", "dist", "node_modules"]);

function hasIgnoredSegment(relativePath: string) {
  return relativePath
    .split("/")
    .some((segment) => segment.startsWith(".") || ignoredDirectorySegments.has(segment));
}

function isRootLevelMarkdown(relativePath: string) {
  return (
    relativePath.endsWith(".md") &&
    !relativePath.includes("/") &&
    path.posix.basename(relativePath) !== "AGENTS.md"
  );
}

function isTopLevelWorkspaceReadme(relativePath: string, scope: "apps" | "packages") {
  if (!relativePath.startsWith(`${scope}/`) || path.posix.basename(relativePath) !== "README.md") {
    return false;
  }

  const relativeScopePath = relativePath.slice(scope.length + 1);
  return relativeScopePath.split("/").length === 2;
}

function isPublishedDocumentCandidate(relativePath: string) {
  if (hasIgnoredSegment(relativePath)) {
    return false;
  }

  if (isRootLevelMarkdown(relativePath)) {
    return true;
  }

  if (relativePath.startsWith("docs/") && relativePath.endsWith(".md")) {
    return true;
  }

  return (
    isTopLevelWorkspaceReadme(relativePath, "apps") ||
    isTopLevelWorkspaceReadme(relativePath, "packages")
  );
}

function isGovernanceDocumentCandidate(relativePath: string) {
  return (
    relativePath.endsWith(".md") &&
    !hasIgnoredSegment(relativePath) &&
    path.posix.basename(relativePath) !== "AGENTS.md"
  );
}

function normalizeDescriptionLine(line: string) {
  return line.replace(/\s+/g, " ").trim();
}

function extractTitle(content: string) {
  const titleLine = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));

  return titleLine ? titleLine.replace(/^#\s+/, "").trim() : "프로젝트 문서";
}

function isDescriptionCandidate(line: string) {
  return (
    line.length > 0 &&
    !line.startsWith("#") &&
    !line.startsWith(">") &&
    !line.startsWith("```") &&
    !line.startsWith("~~~") &&
    !line.startsWith("<!--") &&
    !line.startsWith("- ") &&
    !line.startsWith("* ") &&
    !line.startsWith("|") &&
    !/^\d+\.\s/.test(line) &&
    !/^-{3,}$/.test(line)
  );
}

function extractDescription(content: string) {
  const normalizedContent = content
    .replace(managedSectionBlockPattern, "\n")
    .replace(/```[\s\S]*?```/g, "\n")
    .replace(/~~~[\s\S]*?~~~/g, "\n");

  for (const rawLine of normalizedContent.split(/\r?\n/)) {
    const line = normalizeDescriptionLine(rawLine);
    if (isDescriptionCandidate(line)) {
      return line;
    }
  }

  return `${extractTitle(content)} 문서`;
}

export async function discoverManagedMarkerDocuments(): Promise<ManagedMarkdownFile[]> {
  const markdownFiles = await listFiles(".", (file) => file.endsWith(".md"));
  const managedDocuments: ManagedMarkdownFile[] = [];

  for (const docPath of markdownFiles) {
    const content = await readText(docPath);
    const markers = sortStrings(
      Array.from(
        new Set(Array.from(content.matchAll(managedSectionPattern), (match) => match[1] ?? "")),
      ),
    ).filter((marker) => marker.length > 0);

    if (markers.length === 0) {
      continue;
    }

    managedDocuments.push({
      docPath,
      markers,
    });
  }

  return managedDocuments.sort((left, right) => left.docPath.localeCompare(right.docPath));
}

export async function collectDocDescriptions(docPaths: string[]) {
  const entries = await Promise.all(
    sortStrings(docPaths).map(
      async (docPath) => [docPath, extractDescription(await readText(docPath))] as const,
    ),
  );

  return Object.fromEntries(entries);
}

export function collectGeneratedDocuments(docsRegistry: DocsRegistry): GeneratedDocument[] {
  return Object.entries(docsRegistry.documents ?? {})
    .filter(([, entry]) => Boolean(entry.generated))
    .map(([docPath, entry]) => ({
      docPath,
      generator:
        entry.generator ?? docPath.split("/").pop()?.replace(/\.md$/, "") ?? "generated-doc",
    }))
    .sort((left, right) => left.docPath.localeCompare(right.docPath));
}

async function discoverDocumentPaths(
  docsRegistry: DocsRegistry,
  matcher: (relativePath: string) => boolean,
) {
  const discoveredDocPaths = await listFiles(".", (file) => file.endsWith(".md") && matcher(file));
  const generatedDocPaths = collectGeneratedDocuments(docsRegistry).map(
    (document) => document.docPath,
  );

  return sortStrings(Array.from(new Set([...discoveredDocPaths, ...generatedDocPaths])));
}

export async function discoverGovernanceDocumentPaths(docsRegistry: DocsRegistry) {
  return discoverDocumentPaths(docsRegistry, isGovernanceDocumentCandidate);
}

export async function discoverPublishedDocumentPaths(docsRegistry: DocsRegistry) {
  return discoverDocumentPaths(docsRegistry, isPublishedDocumentCandidate);
}
