# Mountain Race Product Context

- Product: a browser-based spectator party game where 2-8 players watch auto-running hikers race up a mountain.
- Core promise: funny reversals caused by random events, hidden effects, and rank-weighted chaos rather than player skill.
- Session flow: landing -> setup or lobby -> race -> result.
- Audience: casual friend or coworker groups on mobile or desktop, with fast setup and short rounds.
- Race design: no live controls during the race, equal baseline stats, and event-driven drama with visible rankings and finish resolution.
- Frontend surface: `apps/web` with React, TypeScript, Vite, React Three Fiber, and Zustand.
- Backend surface: `apps/api` with Hono on Cloudflare Workers and a Durable Object room runtime.
- Shared contracts: `packages/types` and `packages/game-logic`.
- Product source docs:
  - `docs/mountain-race-product-prd.md`
  - `docs/mountain-race-technical-prd.md`
  - `docs/mountain-race-mvp-guide.md`
- Workspace operating rules:
  - Prefer root `pnpm` scripts from the workspace root.
  - Run the narrowest relevant checks first, then `pnpm check` for broad verification.
  - Treat hook checkpoints as runtime state only; they must stay under `.omx/`.
  - If repo truth conflicts with a checkpoint, prefer the current code and product docs.
