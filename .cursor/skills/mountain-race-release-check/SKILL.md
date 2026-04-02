---
name: mountain-race-release-check
description: Verify release readiness for the mountain race workspace. Use before merging, demoing, or deploying changes that affect UI, gameplay, editor setup, CI, hooks, rules, or other project-level configuration.
---

# Mountain Race Release Check

## Workflow

1. List the surfaces touched: UI, gameplay, API, tooling, Cursor config, CI.
2. Run the narrowest relevant verification for each touched surface.
3. Run `pnpm ci:check` for broad changes.
4. Call out anything not verified.

## Review areas

- UI: mobile, desktop, setup, live race, result
- API: local boot, route shapes, port or env assumptions, frontend integration
- Gameplay: ordering, transitions, finish behavior, event consistency
- Tooling: local scripts, CI parity, shared editor behavior
- Cursor config: rules are scoped cleanly, skills are non-duplicative, hooks are safe

## Done when

- Checks run are explicitly stated.
- Remaining risks are explicit rather than implied away.
