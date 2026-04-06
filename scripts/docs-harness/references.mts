import path from "node:path";

import { pathExists, readText, repoRoot } from "./repo.mts";
import { sortStrings, toPosixPath } from "./utils.mts";

const rootScopedPrefixes = [
  "apps/",
  "packages/",
  "docs/",
  "scripts/",
  ".github/",
  ".cursor/",
  ".codex/",
  ".agents/",
  ".husky/",
];

function normalizeCandidate(candidate: string) {
  let normalized = candidate.trim().replace(/^['"]|['"]$/g, "");

  if (
    normalized.length === 0 ||
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("#") ||
    normalized.startsWith("@")
  ) {
    return null;
  }

  normalized = normalized.replace(/[#?].*$/, "");
  normalized = normalized.replace(/\/\*$/, "");
  normalized = normalized.replace(/\/$/, "");

  if (normalized === "." || normalized === ".." || normalized.length === 0) {
    return null;
  }

  return normalized;
}

function isPathLikeCandidate(candidate: string) {
  if (candidate.endsWith(".md")) {
    return false;
  }

  return candidate.includes("/") || candidate.includes(".");
}

function isOverlyBroadCandidate(candidate: string) {
  if (candidate.includes("/dist") || candidate.endsWith("/dist")) {
    return true;
  }

  const segments = candidate.split("/").filter(Boolean);

  return (
    !candidate.includes(".") &&
    segments.length <= 2 &&
    (candidate.startsWith("apps/") || candidate.startsWith("packages/"))
  );
}

function baseDirectoriesFor(docPath: string, candidate: string) {
  const docDir = path.join(repoRoot, path.dirname(docPath));
  const rootFirst =
    candidate.startsWith("/") || rootScopedPrefixes.some((prefix) => candidate.startsWith(prefix));

  return rootFirst ? [repoRoot, docDir] : [docDir, repoRoot];
}

async function resolveCandidate(
  docPath: string,
  rawCandidate: string,
  options: { allowBroadCandidate?: boolean; allowSimpleCandidate?: boolean } = {},
) {
  const candidate = normalizeCandidate(rawCandidate);
  if (
    !candidate ||
    (!options.allowSimpleCandidate && !isPathLikeCandidate(candidate)) ||
    (!options.allowBroadCandidate && isOverlyBroadCandidate(candidate))
  ) {
    return null;
  }

  for (const baseDir of baseDirectoriesFor(docPath, candidate)) {
    const absolutePath = path.resolve(baseDir, candidate);
    const relativePath = toPosixPath(path.relative(repoRoot, absolutePath));

    if (
      relativePath.startsWith("../") ||
      relativePath === ".." ||
      relativePath === docPath ||
      relativePath.length === 0
    ) {
      continue;
    }

    if (await pathExists(relativePath)) {
      return relativePath;
    }
  }

  return null;
}

function extractMarkdownLinkCandidates(content: string) {
  return Array.from(content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g), (match) => match[1] ?? "");
}

function extractCodeSpanCandidates(content: string) {
  const withoutCodeFences = content
    .replace(/```[\s\S]*?```/g, "\n")
    .replace(/~~~[\s\S]*?~~~/g, "\n");

  return Array.from(withoutCodeFences.matchAll(/`([^`\n]+)`/g), (match) => match[1] ?? "");
}

export async function collectWatchPathSources(docPath: string, watchPathOverrides: string[] = []) {
  return collectWatchPathSourcesWithConfig(docPath, { watchPathOverrides });
}

export async function collectWatchPathSourcesWithConfig(
  docPath: string,
  options: {
    ignoredWatchPaths?: string[] | undefined;
    watchPathOverrides?: string[] | undefined;
  } = {},
) {
  const content = await readText(docPath);
  const autoCandidates = [
    ...extractMarkdownLinkCandidates(content),
    ...extractCodeSpanCandidates(content),
  ];
  const watchPathOverrides = options.watchPathOverrides ?? [];
  const ignoredWatchPaths = new Set(options.ignoredWatchPaths ?? []);

  const [autoResolvedPaths, manualResolvedPaths] = await Promise.all([
    Promise.all(autoCandidates.map((candidate) => resolveCandidate(docPath, candidate))),
    Promise.all(
      watchPathOverrides.map((candidate) =>
        resolveCandidate(docPath, candidate, {
          allowBroadCandidate: true,
          allowSimpleCandidate: true,
        }),
      ),
    ),
  ]);

  const autoWatchPaths = sortStrings(
    Array.from(
      new Set(autoResolvedPaths.filter((value): value is string => value !== null)),
    ).filter((watchPath) => !ignoredWatchPaths.has(watchPath)),
  );
  const manualWatchPaths = sortStrings(
    Array.from(
      new Set(manualResolvedPaths.filter((value): value is string => value !== null)),
    ).filter((watchPath) => !ignoredWatchPaths.has(watchPath)),
  );
  const watchPaths = sortStrings(
    Array.from(new Set([...autoWatchPaths, ...manualWatchPaths])).filter(
      (watchPath) => !ignoredWatchPaths.has(watchPath),
    ),
  );

  return {
    autoWatchPaths,
    manualWatchPaths,
    watchPaths,
  };
}

export async function collectWatchPaths(docPath: string, watchPathOverrides: string[] = []) {
  const sources = await collectWatchPathSourcesWithConfig(docPath, { watchPathOverrides });
  return sources.watchPaths;
}
