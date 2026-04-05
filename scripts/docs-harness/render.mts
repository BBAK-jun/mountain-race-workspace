import path from "node:path";

import { collectDocGovernance } from "./governance.mts";
import { formatManagedOutput, readText } from "./repo.mts";
import type {
  DocGovernance,
  WorkspaceSnapshot,
  WorkspaceSnapshotWithGovernance,
} from "./types.mts";
import {
  formatBulletList,
  formatUnixDate,
  markdownLink,
  replaceManagedSection,
  routePathFromFile,
} from "./utils.mts";
import { collectWorkspaceSnapshot, formatScripts } from "./workspace.mts";

function buildReadmeSnapshot(snapshot: WorkspaceSnapshot) {
  const liveRoutes = snapshot.webRoutes
    .map((routeFile) => `\`${routePathFromFile(routeFile)}\``)
    .join(", ");

  return formatBulletList([
    `- 앱 상태: \`apps/web\`는 ${snapshot.webRoutes.length}개 route 파일과 ${snapshot.webFeatureFiles.length}개 feature 파일을 가진 플레이어 클라이언트이고, \`apps/api\`는 ${snapshot.apiSourceFiles.length}개 TypeScript 파일로 구성된 멀티플레이어 API다.`,
    `- 공유 패키지: \`${snapshot.gameLogicPackage.name}\`, \`${snapshot.typesPackage.name}\``,
    `- 문서 상태: \`${snapshot.docs.length}\`개 Markdown 문서와 \`${snapshot.workflows.length}\`개 GitHub workflow가 정리돼 있다.`,
    `- AI surface: Cursor rules ${snapshot.cursorRules.length}개 / Cursor skills ${snapshot.cursorSkills.length}개 / Cursor agents ${snapshot.cursorAgents.length}개 / Codex skills ${snapshot.codexSkills.length}개 / Codex subagents ${snapshot.codexAgents.length}개`,
    `- 현재 웹 route: ${liveRoutes}`,
  ]);
}

function buildReadmeDocs(snapshot: WorkspaceSnapshot) {
  return buildDocsInventorySection("README.md", snapshot);
}

function buildDocsInventorySection(fromFile: string, snapshot: WorkspaceSnapshot) {
  return formatBulletList(
    snapshot.docs
      .filter((docPath) => docPath !== fromFile)
      .map((docPath) => {
        const description = snapshot.docDescriptions[docPath] ?? "프로젝트 문서";
        return `- ${markdownLink(fromFile, docPath)}: ${description}`;
      }),
  );
}

function buildReadmeAiSurface(snapshot: WorkspaceSnapshot) {
  const cursorSkillNames = snapshot.cursorSkills
    .map((dir) => `\`${path.basename(dir)}\``)
    .join(", ");
  const codexSkillNames = snapshot.codexSkills.map((dir) => `\`${path.basename(dir)}\``).join(", ");
  const codexAgentNames = snapshot.codexAgents
    .map((file) => `\`${path.basename(file, ".toml")}\``)
    .join(", ");

  return formatBulletList([
    `- Cursor rules: ${snapshot.cursorRules.map((file) => `\`${path.basename(file)}\``).join(", ")}`,
    `- Cursor skills: ${cursorSkillNames}`,
    `- Codex skills: ${codexSkillNames}`,
    `- Codex subagents: ${codexAgentNames}`,
  ]);
}

function buildDocsInventory(snapshot: WorkspaceSnapshot) {
  return buildDocsInventorySection("docs/README.md", snapshot);
}

function buildDocsWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
  return formatBulletList([
    `- 웹 클라이언트: ${snapshot.webRoutes.length}개 route 파일, ${snapshot.webFeatureFiles.length}개 feature 파일`,
    `- API 서버: domain ${snapshot.apiLayers.domain.length}개 / application ${snapshot.apiLayers.application.length}개 / infrastructure ${snapshot.apiLayers.infrastructure.length}개 / presentation ${snapshot.apiLayers.presentation.length}개`,
    `- 자동화: GitHub workflow ${snapshot.workflows.length}개, Husky hook \`pre-commit\` + \`pre-push\`, root script \`docs:sync\` / \`docs:check\` / \`docs:audit\``,
  ]);
}

function buildDocsFreshnessSummary(governance: DocGovernance) {
  const current = governance.counts.current ?? 0;
  const stale = governance.counts.stale ?? 0;
  const generated = governance.counts.generated ?? 0;
  const manual = governance.counts.manual ?? 0;
  const workingTreeWarnings = governance.auditCounts["stale-working-tree"] ?? 0;
  const inProgress = governance.auditCounts["in-progress"] ?? 0;

  const staleDocs = governance.statuses.filter((item) => item.status === "stale");
  const warningDocs = governance.statuses.filter(
    (item) => item.auditStatus === "stale-working-tree",
  );

  const lines = [
    `- current ${current}개 / stale ${stale}개 / generated ${generated}개 / manual ${manual}개`,
    `- working tree warning ${workingTreeWarnings}개 / in-progress ${inProgress}개`,
    "- DRI는 하네스가 계산하고, review 기준과 manual watch override는 `docs/docs-registry.json`이 관리한다.",
  ];

  if (staleDocs.length > 0) {
    lines.push(
      `- stale 문서: ${staleDocs.map((item) => `\`${item.docPath}\` (${item.dri})`).join(", ")}`,
    );
  } else {
    lines.push("- stale 문서 없음");
  }

  if (warningDocs.length > 0) {
    lines.push(
      `- working tree 경고: ${warningDocs
        .map((item) => `\`${item.docPath}\` (${item.dri})`)
        .join(", ")}`,
    );
  } else {
    lines.push("- working tree 경고 없음");
  }

  return formatBulletList(lines);
}

function buildProjectHarnessManagedDocs(snapshot: WorkspaceSnapshot) {
  return formatBulletList(snapshot.managedDocFiles.map((docPath) => `- \`${docPath}\``));
}

function buildProjectHarnessGovernanceDocs(governance: DocGovernance) {
  return formatBulletList(governance.statuses.map((item) => `- \`${item.docPath}\``));
}

function buildAppsInventory(snapshot: WorkspaceSnapshot) {
  const webRoutes = snapshot.webRoutes.map((file) => `\`${routePathFromFile(file)}\``).join(", ");
  return formatBulletList([
    `- \`${snapshot.webPackage.name}\`: Vite + TanStack Router + React Three Fiber 클라이언트, route ${webRoutes}`,
    `- \`${snapshot.apiPackage.name}\`: Hono + Cloudflare Durable Object 기반 멀티플레이어 API`,
    `- \`${snapshot.gameLogicPackage.name}\`: 게임 밸런스, 이벤트, 대사 스케줄러 공유 로직`,
    `- \`${snapshot.typesPackage.name}\`: 클라이언트와 서버가 함께 쓰는 타입 계약`,
  ]);
}

function buildApiRuntimeBlock(snapshot: WorkspaceSnapshot) {
  return [
    "### Generated Runtime Snapshot",
    "",
    formatBulletList([
      `- 패키지: \`${snapshot.apiPackage.name}\``,
      `- 스크립트: ${Object.keys(snapshot.apiPackage.scripts ?? {})
        .map((name) => `\`${name}\``)
        .join(", ")}`,
      `- 레이어 파일 수: domain ${snapshot.apiLayers.domain.length} / application ${snapshot.apiLayers.application.length} / infrastructure ${snapshot.apiLayers.infrastructure.length} / presentation ${snapshot.apiLayers.presentation.length}`,
      `- HTTP surface: ${snapshot.apiLayers.presentation
        .map((file) => `\`${file.replace("apps/api/src/presentation/http/", "")}\``)
        .join(", ")}`,
      "- 핵심 런타임: `apps/api/src/infrastructure/durableObject/RaceRoom.ts`, `apps/api/src/presentation/http/app.ts`",
    ]),
  ].join("\n");
}

function buildWebRuntimeBlock(snapshot: WorkspaceSnapshot) {
  return [
    "### Generated Runtime Snapshot",
    "",
    formatBulletList([
      `- 패키지: \`${snapshot.webPackage.name}\``,
      `- 스크립트: ${Object.keys(snapshot.webPackage.scripts ?? {})
        .map((name) => `\`${name}\``)
        .join(", ")}`,
      `- route 파일: ${snapshot.webRoutes
        .map((file) => `\`${routePathFromFile(file)}\``)
        .join(", ")}`,
      `- feature 파일 수: ${snapshot.webFeatureFiles.length}`,
      "- 핵심 feature 디렉토리: `app`, `components`, `screens`, `store`, `systems`",
    ]),
  ].join("\n");
}

function buildDocOwnershipTable(governance: DocGovernance) {
  return [
    "| Document | DRI | Kind | Last reviewed | Freshness | Audit | Notes |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...governance.statuses.map((item) => {
      const lastReviewed = item.lastReviewedAt ?? "-";
      const note = item.generated
        ? "generated"
        : item.latestWatchedCommit
          ? `watch ${item.watchPaths.length}개 (auto ${item.autoWatchPaths.length} / manual ${item.manualWatchPaths.length}); last watched change ${formatUnixDate(item.latestWatchedCommit)}`
          : `watch ${item.watchPaths.length}개 (auto ${item.autoWatchPaths.length} / manual ${item.manualWatchPaths.length})`;
      const audit = item.auditStatus === item.status ? "-" : `\`${item.auditStatus}\``;
      const details = item.auditStatus === item.status ? note : `${note}; ${item.auditReason}`;
      return `| \`${item.docPath}\` | ${item.dri} | \`${item.kind}\` | ${lastReviewed} | \`${item.status}\` | ${audit} | ${details} |`;
    }),
  ].join("\n");
}

function buildProjectStatus(snapshot: WorkspaceSnapshotWithGovernance) {
  return [
    "# Project Status",
    "",
    "> Generated by `pnpm docs:sync`. Edit the source code or the harness, not this file.",
    "",
    "## Workspace",
    "",
    formatBulletList([
      `- package manager: \`${snapshot.rootPackage.packageManager}\``,
      `- root scripts: ${Object.keys(snapshot.rootPackage.scripts ?? {})
        .map((name) => `\`${name}\``)
        .join(", ")}`,
      `- docs tracked by harness: ${snapshot.managedDocFiles.map((file) => `\`${file}\``).join(", ")}`,
    ]),
    "",
    "## Apps",
    "",
    `### ${snapshot.webPackage.name}`,
    "",
    formatBulletList([
      `- scripts: ${formatScripts(snapshot.webPackage)
        .map((line) => line.replace(/^- /, ""))
        .join(", ")}`,
      `- routes: ${snapshot.webRoutes
        .map((routeFile) => `\`${routePathFromFile(routeFile)}\``)
        .join(", ")}`,
      `- feature files: ${snapshot.webFeatureFiles.length}`,
    ]),
    "",
    `### ${snapshot.apiPackage.name}`,
    "",
    formatBulletList([
      `- scripts: ${formatScripts(snapshot.apiPackage)
        .map((line) => line.replace(/^- /, ""))
        .join(", ")}`,
      `- source files: ${snapshot.apiSourceFiles.length}`,
      `- layers: domain ${snapshot.apiLayers.domain.length} / application ${snapshot.apiLayers.application.length} / infrastructure ${snapshot.apiLayers.infrastructure.length} / presentation ${snapshot.apiLayers.presentation.length}`,
    ]),
    "",
    "## Shared Packages",
    "",
    formatBulletList([
      `- \`${snapshot.gameLogicPackage.name}\`: exports ${Object.keys(
        snapshot.gameLogicPackage.exports ?? {},
      )
        .map((key) => `\`${key}\``)
        .join(", ")}`,
      `- \`${snapshot.typesPackage.name}\`: exports ${Object.keys(
        snapshot.typesPackage.exports ?? {},
      )
        .map((key) => `\`${key}\``)
        .join(", ")}`,
    ]),
    "",
    "## Documents",
    "",
    buildDocsInventory(snapshot),
    "",
    "## Documentation DRI",
    "",
    buildDocOwnershipTable(snapshot.docGovernance),
    "",
    "## Automation",
    "",
    formatBulletList([
      `- GitHub workflows: ${snapshot.workflows.map((file) => `\`${path.basename(file)}\``).join(", ")}`,
      `- Cursor surface: rules ${snapshot.cursorRules.length}, skills ${snapshot.cursorSkills.length}, agents ${snapshot.cursorAgents.length}`,
      `- Codex surface: skills ${snapshot.codexSkills.length}, subagents ${snapshot.codexAgents.length}`,
      "- Husky: `pre-commit` runs `pnpm docs:sync` and restages managed docs, `pre-push` runs `pnpm check`",
      "- Freshness audit: `pnpm docs:audit` runs inside `pnpm check` and uses auto-detected doc references plus `docs/docs-registry.json` overrides",
    ]),
    "",
  ].join("\n");
}

export async function buildOutputs() {
  const snapshot: WorkspaceSnapshotWithGovernance = {
    ...(await collectWorkspaceSnapshot()),
    docGovernance: await collectDocGovernance(),
  };
  const sectionBuilders = new Map<string, (docPath: string) => string>([
    ["readme-snapshot", () => buildReadmeSnapshot(snapshot)],
    ["readme-docs", () => buildReadmeDocs(snapshot)],
    ["readme-ai-surface", () => buildReadmeAiSurface(snapshot)],
    ["docs-inventory", (docPath) => buildDocsInventorySection(docPath, snapshot)],
    ["docs-workspace-snapshot", () => buildDocsWorkspaceSnapshot(snapshot)],
    ["docs-freshness-summary", () => buildDocsFreshnessSummary(snapshot.docGovernance)],
    ["apps-inventory", () => buildAppsInventory(snapshot)],
    ["api-runtime-snapshot", () => buildApiRuntimeBlock(snapshot)],
    [
      "project-harness-governance-docs",
      () => buildProjectHarnessGovernanceDocs(snapshot.docGovernance),
    ],
    ["project-harness-managed-docs", () => buildProjectHarnessManagedDocs(snapshot)],
    ["web-runtime-snapshot", () => buildWebRuntimeBlock(snapshot)],
  ]);
  const generatedBuilders = new Map<string, () => string>([
    ["project-status", () => buildProjectStatus(snapshot)],
  ]);
  const rawOutputs = new Map<string, string>();

  for (const markerDocument of snapshot.managedMarkerDocuments) {
    let content = await readText(markerDocument.docPath);

    for (const marker of markerDocument.markers) {
      const sectionBuilder = sectionBuilders.get(marker);
      if (!sectionBuilder) {
        throw new Error(`No section builder registered for docs-harness marker: ${marker}`);
      }

      content = replaceManagedSection(content, marker, sectionBuilder(markerDocument.docPath));
    }

    rawOutputs.set(markerDocument.docPath, content);
  }

  for (const generatedDocument of snapshot.generatedDocuments) {
    const generatedBuilder = generatedBuilders.get(generatedDocument.generator);

    if (!generatedBuilder) {
      throw new Error(
        `No generated builder registered for docs-harness generator: ${generatedDocument.generator}`,
      );
    }

    rawOutputs.set(generatedDocument.docPath, generatedBuilder());
  }

  const formattedOutputs = new Map<string, string>();

  for (const [relativePath, content] of rawOutputs) {
    formattedOutputs.set(relativePath, await formatManagedOutput(relativePath, content));
  }

  return formattedOutputs;
}
