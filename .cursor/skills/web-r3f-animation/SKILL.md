---
name: web-r3f-animation
description: React Three Fiber animation patterns for Cursor. Use when animating meshes with useFrame, driving procedural motion, controlling GLTF animations with useAnimations, or adding spring-based movement in scene components.
---

# R3F Animation

Open `tutorials/basic-animations`, `api/hooks`, and `advanced/pitfalls` from `.cursor/skills/web-r3f-fundamentals/references/llm.txt` before deep animation changes.

## Recommended Routes

- First animation or ref-based motion: [Basic Animations](https://r3f.docs.pmnd.rs/tutorials/basic-animations)
- Frame-loop API, priorities, render takeover, loader-linked animation: [Hooks](https://r3f.docs.pmnd.rs/api/hooks)
- Loop performance and anti-pattern review: [Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls), [Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- React 19 or v9 animation-adjacent changes: [v9 Migration Guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)

## Use this skill when

- Writing or reviewing `useFrame` logic
- Adding idle motion, camera motion, racer movement, or procedural transforms
- Playing or blending GLTF animation clips
- Choosing between direct mutation, springs, or timeline-style animation

## Workflow

1. Decide whether the animation is frame-driven, clip-driven, or spring-driven.
2. Use refs and delta-based mutation for hot paths inside `useFrame`.
3. Keep `useAnimations` ownership near the loaded model and make clip names explicit.
4. When animations can sleep, consider `frameloop="demand"` plus manual invalidation.
5. Review `advanced/pitfalls` before shipping any loop that touches state every frame.

## Guardrails

- Do not call `setState` in `useFrame` unless there is a very narrow, justified reason.
- Do not use fixed increments without `delta` for movement that should be refresh-rate independent.
- Do not bury animation ownership across many unrelated components.

## Done when

- The animation source of truth is clear.
- Frame-loop work is cheap and delta-based.
- Clip transitions or procedural motion are understandable from the component structure.
