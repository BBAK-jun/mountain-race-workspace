import { execFile as execFileCallback } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

import { sortStrings, toPosixPath } from "./utils.mts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const repoRoot = path.resolve(__dirname, "../..");

export async function readText(relativePath: string) {
  return fs.readFile(path.join(repoRoot, relativePath), "utf8");
}

export async function readJson<T>(relativePath: string): Promise<T> {
  return JSON.parse(await readText(relativePath)) as T;
}

export async function runGit(args: string[]): Promise<string> {
  const { stdout } = await new Promise<{ stdout: string }>((resolve, reject) => {
    execFileCallback("git", args, { cwd: repoRoot, encoding: "utf8" }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ stdout });
    });
  });

  return stdout.trimEnd();
}

export async function pathExists(relativePath: string) {
  try {
    await fs.access(path.join(repoRoot, relativePath));
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(
  relativeDir: string,
  predicate: (relativePath: string) => boolean = () => true,
) {
  const results: string[] = [];
  const startDir = path.join(repoRoot, relativeDir);

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === ".git" || entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }

      const absolutePath = path.join(currentDir, entry.name);
      const relativePath = toPosixPath(path.relative(repoRoot, absolutePath));

      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (predicate(relativePath)) {
        results.push(relativePath);
      }
    }
  }

  if (await pathExists(relativeDir)) {
    await walk(startDir);
  }

  return sortStrings(results);
}

export async function listDirectories(
  relativeDir: string,
  filter: (name: string) => boolean = () => true,
) {
  if (!(await pathExists(relativeDir))) {
    return [];
  }

  const entries = await fs.readdir(path.join(repoRoot, relativeDir), { withFileTypes: true });
  return sortStrings(
    entries
      .filter((entry) => entry.isDirectory() && filter(entry.name))
      .map((entry) => toPosixPath(path.join(relativeDir, entry.name))),
  );
}

export async function latestCommitTimestamp(paths: string[]) {
  if (paths.length === 0) {
    return null;
  }

  const stdout = await runGit(["log", "-1", "--format=%ct", "--", ...paths]).catch(() => "");
  if (!stdout) {
    return null;
  }

  const timestamp = Number.parseInt(stdout, 10);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export async function gitDirtyPaths(paths: string[]) {
  if (paths.length === 0) {
    return [];
  }

  const stdout = await runGit(["status", "--short", "--", ...paths]).catch(() => "");
  if (!stdout) {
    return [];
  }

  return stdout
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.slice(3).trim());
}

export async function formatManagedOutput(relativePath: string, content: string) {
  const absolutePath = path.join(repoRoot, relativePath);
  const resolvedConfig = (await prettier.resolveConfig(absolutePath)) ?? {};

  return prettier.format(content, {
    ...resolvedConfig,
    filepath: absolutePath,
  });
}
