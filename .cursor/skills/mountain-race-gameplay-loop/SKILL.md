---
name: mountain-race-gameplay-loop
description: Implement and tune the mountain race simulation logic. Use when changing race state transitions, countdowns, progress updates, ranking, event triggers, finish conditions, logs, or gameplay balance in the web game.
---

# Mountain Race Gameplay Loop

## Use this skill when

- Editing simulation rules or pacing
- Refactoring gameplay logic out of UI-heavy files
- Adjusting event randomness or balance constants
- Debugging leaderboard or finish-state bugs

## Workflow

1. Write down the invariant that must stay true.
2. Separate authoritative state updates from presentation formatting.
3. Keep race phases explicit and auditable.
4. Verify edge cases:
   - no players
   - minimum viable player count
   - ties
   - simultaneous finish
   - repeated events
5. Confirm logs match the actual state transition.

## Guardrails

- Avoid hidden coupling between timers, ranking, and labels.
- Prefer named constants for balancing values.
- Never let UI sorting accidentally become the source of truth.

## Done when

- Transition logic is understandable from the code layout.
- Ranking and finish behavior stay coherent under edge cases.
- Validation covered both happy-path pacing and awkward state boundaries.
