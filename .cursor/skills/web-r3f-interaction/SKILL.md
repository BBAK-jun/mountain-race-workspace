---
name: web-r3f-interaction
description: React Three Fiber interaction patterns for Cursor. Use when handling pointer events, selection, dragging, controls, raycasting behavior, or interactive camera and mesh responses in 3D scenes.
---

# R3F Interaction

Open `tutorials/events-and-interaction` and `api/events` from `.cursor/skills/web-r3f-fundamentals/references/llm.txt` first.

## Recommended Routes

- Simple clickable or hoverable mesh behavior: [Events and Interaction](https://r3f.docs.pmnd.rs/tutorials/events-and-interaction)
- Full event payload, bubbling, capture, custom event manager setup: [Events](https://r3f.docs.pmnd.rs/api/events)
- Shared root state, pointer data, controls invalidation: [Hooks](https://r3f.docs.pmnd.rs/api/hooks)
- High-frequency interaction performance review: [Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)

## Use this skill when

- Adding click, hover, drag, or pointer move behavior to meshes
- Debugging odd bubbling, occlusion, or pointer capture behavior
- Wiring camera controls such as orbit or map controls
- Building selection, focus, or hit-testing flows in 3D space

## Workflow

1. Identify whether the interaction belongs to a mesh, a control component, or the canvas background.
2. Keep local hover and selection state as close as possible to the event target.
3. Use `event.stopPropagation()` deliberately when meshes should block hits behind them.
4. For controls, decide whether the scene should update continuously or only invalidate on change.
5. Check event payload usage against `api/events` instead of assuming DOM semantics.

## Guardrails

- Do not assume DOM bubbling rules map cleanly to occluded 3D objects.
- Do not drive high-frequency pointer motion through broad React state updates.
- Do not leave cursor changes or pointer capture cleanup implicit.

## Done when

- Hit targets and propagation behavior are predictable.
- Control ownership is explicit.
- Interaction code matches R3F event semantics rather than DOM guesses.
