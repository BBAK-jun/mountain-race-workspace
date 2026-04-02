#!/bin/sh
set -eu

if git diff --quiet -- apps/web apps/api package.json pnpm-workspace.yaml tsconfig.base.json biome.json .cursor .vscode .github README.md AGENTS.md; then
  exit 0
fi

printf '[cursor-hook] Workspace changed. Run pnpm ci:check before shipping.\n' >&2
