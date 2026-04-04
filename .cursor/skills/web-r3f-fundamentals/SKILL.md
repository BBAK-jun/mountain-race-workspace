---
name: web-r3f-fundamentals
description: React Three Fiber fundamentals for Cursor. Use when setting up Canvas, useFrame, useThree, JSX scene elements, refs, or converting imperative three.js patterns into declarative React scene components.
---

# R3F Fundamentals

Read `references/llm.txt` first when you need the official docs route map.
If bootstrapping a new scene or replacing imperative setup, start from `assets/r3f-scene-starter.tsx` and adapt it instead of rebuilding the same baseline from scratch.

## Recommended Routes

- First-pass mental model and React compatibility: [Introduction](https://r3f.docs.pmnd.rs/getting-started/introduction)
- Bootstrapping by framework or install path: [Installation](https://r3f.docs.pmnd.rs/getting-started/installation)
- Converting raw three.js into JSX scene structure: [Your first scene](https://r3f.docs.pmnd.rs/getting-started/your-first-scene), [Objects](https://r3f.docs.pmnd.rs/api/objects)
- Root and hook semantics: [Canvas](https://r3f.docs.pmnd.rs/api/canvas), [Hooks](https://r3f.docs.pmnd.rs/api/hooks)

## Use this skill when

- Setting up a new `Canvas` root or replacing manual renderer bootstrapping
- Converting raw `THREE.*` setup into JSX scene components
- Deciding where `useThree`, `useFrame`, refs, and local state should live
- Reviewing whether scene code follows R3F rather than plain three.js habits

## Workflow

1. Start from the declarative model: `Canvas` owns the root scene, camera, render loop, and event layer.
2. Express three.js classes as JSX elements first, then use refs only where direct mutation is truly needed.
3. Keep per-frame work inside `useFrame`, and keep React state for slower UI or interaction state.
4. Use `api/objects`, `api/canvas`, and `api/hooks` from the local `llm.txt` route map as the source of truth.
5. Hand off specialized work to `web-r3f-animation`, `web-r3f-interaction`, `web-r3f-loaders`, or other focused R3F skills when the task narrows.

## Guardrails

- Do not rebuild a manual `THREE.WebGLRenderer` lifecycle unless the task explicitly requires a low-level escape hatch.
- Do not treat JSX scene elements like DOM nodes; use the R3F object and hook model.
- Do not keep broad scene ownership and game state tangled in one component.

## Done when

- Scene ownership is obvious from `Canvas` downward.
- Hooks and refs have clear responsibilities.
- The code reads like R3F first, not a thin wrapper around imperative three.js.
