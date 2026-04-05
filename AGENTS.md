# Workspace Guide

## Tooling

- Package manager: `pnpm`
- Dependency versions: `pnpm catalog`
- Formatting: `pnpm format` with Prettier
- Lint and import cleanup: `pnpm lint` with Biome
- Type checking: `pnpm typecheck`
- CI gate: `pnpm check`

## Layout

- Root holds shared config, CI, editor settings, and AI guidance.
- App code lives under `apps/*`.
- Frontend lives in `apps/web`.
- Backend lives in `apps/api`.
- Reusable packages should live under `packages/*`.
- `packages/types` holds shared type contracts (`@mountain-race/types`).
- `packages/game-logic` holds shared simulation logic (`@mountain-race/game-logic`).
- Backend follows clean architecture: `apps/api/src/{domain,application,infrastructure,presentation}`.
- Passive, always-on agent context lives in this `AGENTS.md`; Cursor-specific passive context also lives under `.cursor/rules/*`.
- App-specific passive context can live in nested rule directories such as `apps/web/.cursor/rules/*`.
- Active, on-demand Cursor workflows live under `.cursor/skills/*`.
- Active, on-demand Codex workflows live under `.agents/skills/*`.
- Specialized Cursor subagents live under `.cursor/agents/*`.
- Specialized Codex subagents live under `.codex/agents/*`.
- Project-level Cursor hook and MCP config live in `.cursor/hooks.json` and `.cursor/mcp.json`.
- Project-level Codex config lives under `.codex/config.toml`.

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
- Run the narrowest relevant checks first, then `pnpm check` for broad changes.
- If UI changed, verify both mobile and desktop layouts.
- If API changed, verify endpoint shape, local boot assumptions, and frontend integration expectations.
- If gameplay changed, verify state transitions, ordering, and finish behavior.
- If AI-tooling config changed, verify the repo-local Cursor and Codex surfaces still make sense for a fresh contributor.
