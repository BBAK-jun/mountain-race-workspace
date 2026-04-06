#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

import { collectDocGovernance } from "./governance.mts";
import { pathExists, repoRoot } from "./repo.mts";
import { buildOutputs } from "./render.mts";

const isCheckMode = process.argv.includes("--check");
const isAuditMode = process.argv.includes("--audit");

async function main() {
  if (isAuditMode) {
    const governance = await collectDocGovernance();
    const failingStatuses = governance.statuses.filter((item) => item.auditStatus === "stale");
    const warningStatuses = governance.statuses.filter(
      (item) => item.auditStatus === "stale-working-tree" || item.auditStatus === "in-progress",
    );

    console.log("Docs audit summary:");
    for (const item of governance.statuses) {
      console.log(
        `- ${item.docPath}: ${item.auditStatus} (DRI: ${item.dri}; reason: ${item.auditReason})`,
      );
    }

    if (failingStatuses.length > 0) {
      console.error("\nDocs audit failed. Review these documents:");
      for (const item of failingStatuses) {
        console.error(`- ${item.docPath} -> ${item.dri}: ${item.auditReason}`);
      }
      process.exitCode = 1;
      return;
    }

    if (warningStatuses.length > 0) {
      console.log("\nDocs audit passed with working tree warnings.");
      return;
    }

    console.log("\nDocs audit passed.");
    return;
  }

  const outputs = await buildOutputs();
  const changedFiles: string[] = [];

  for (const [relativePath, nextValue] of outputs) {
    const absolutePath = path.join(repoRoot, relativePath);
    const currentValue = (await pathExists(relativePath))
      ? await fs.readFile(absolutePath, "utf8")
      : null;

    if (currentValue !== nextValue) {
      changedFiles.push(relativePath);

      if (!isCheckMode) {
        await fs.writeFile(absolutePath, nextValue, "utf8");
      }
    }
  }

  if (isCheckMode) {
    if (changedFiles.length > 0) {
      console.error("Docs harness detected stale managed files:");
      for (const file of changedFiles) {
        console.error(`- ${file}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log("Docs harness check passed.");
    return;
  }

  if (changedFiles.length === 0) {
    console.log("Docs harness: no changes.");
    return;
  }

  console.log("Docs harness updated:");
  for (const file of changedFiles) {
    console.log(`- ${file}`);
  }
}

await main();
