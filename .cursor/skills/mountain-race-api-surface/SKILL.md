---
name: mountain-race-api-surface
description: Build and refactor the mountain race backend app. Use when adding routes, presets, persistence boundaries, server-side orchestration, environment handling, or API contracts for the TypeScript Hono service in apps/api.
---

# Mountain Race API Surface

## Use this skill when

- Editing `apps/api/src`
- Adding or changing route payloads
- Introducing persistence or server-side orchestration
- Wiring the web client to backend data

## Workflow

1. Define the contract first: route, method, response shape, failure shape.
2. Keep the base local API bootable without extra infrastructure.
3. Keep UI formatting concerns in the web app, not the API route.
4. Verify any frontend dependency on the route still holds.
5. Run `pnpm --filter @mountain-race/api typecheck` and broader checks when needed.

## Guardrails

- Avoid undocumented environment requirements.
- Avoid response payloads that force the frontend to reverse-engineer intent.
- Keep route handlers short enough that the contract stays visible.

## Done when

- The route contract is obvious from the code.
- The local dev path still works.
- Broader verification is called out when cross-app integration changed.
