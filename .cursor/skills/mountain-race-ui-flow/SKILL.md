---
name: mountain-race-ui-flow
description: Build or refactor the mountain race web game's player-facing UI. Use when the task involves lobby setup, race HUD, leaderboard, event feed, result screens, responsive layout, or spectator-focused visual polish in the React app.
---

# Mountain Race UI Flow

## Use this skill when

- Editing `apps/web/src` UI structure
- Improving lobby, race HUD, or result screens
- Refactoring large React views into readable sections
- Tightening mobile and desktop responsiveness

## Workflow

1. Identify which product state is affected: setup, live race, or result.
2. Make the primary spectator signals obvious:
   - current leader
   - player ordering
   - notable race events
   - finish state
3. Keep the most important data visible before decorative content.
4. Validate narrow-screen readability before polishing desktop spacing.
5. Run `pnpm lint` and broader checks when the change spans multiple areas.

## Guardrails

- Do not turn the game surface into a CRUD-like admin layout.
- Do not hide leaderboard information behind tabs or low-contrast styling.
- Do not keep unrelated screen responsibilities in one large component if it hurts scanability.

## Done when

- The screen reads clearly in one pass.
- Setup, live race, and result views feel distinct.
- The change is ready for `pnpm ci:check` if it affected more than a local visual detail.
