# Workspace Guide

## Tooling

- Package manager: `pnpm`
- Dependency versions: `pnpm catalog`
- Formatting: `pnpm format` with Prettier
- Lint and import cleanup: `pnpm lint` with Biome
- Type checking: `pnpm typecheck`
- CI gate: `pnpm ci:check`

## Layout

- Root holds shared config, CI, editor settings, and AI guidance.
- App code lives under `apps/*`.
- Frontend lives in `apps/web`.
- Backend lives in `apps/api`.
- Reusable packages should live under `packages/*`.
- Passive, always-on agent context lives in this `AGENTS.md` and `.cursor/rules/*`.
- App-specific passive context can live in nested rule directories such as `apps/web/.cursor/rules/*`.
- Active, on-demand agent workflows live under `.cursor/skills/*`.
- Specialized Cursor subagents live under `.cursor/agents/*`.
- Project-level Cursor hook and MCP config live in `.cursor/hooks.json` and `.cursor/mcp.json`.

## Workflow

- Run commands from the workspace root unless a package needs a direct command.
- Prefer shared root scripts over ad-hoc per-package commands.
- Keep aliases aligned with `tsconfig` and `vite.config.ts`.
- Prefer TypeScript for new app and config code.
- When adding dependencies, define the version in `pnpm-workspace.yaml` catalog and reference it with `catalog:`.
- Do not commit generated output such as `dist/` or local tool state.
- Use rules for always-on constraints, skills for longer workflows, and subagents for parallel specialist work.
- Keep hook behavior lightweight and non-destructive.
- Add MCP servers only when the project has a real external integration to justify them.
