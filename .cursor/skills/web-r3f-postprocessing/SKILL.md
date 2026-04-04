---
name: web-r3f-postprocessing
description: React Three Fiber post-processing workflows for Cursor. Use when adding bloom, DOF, noise, vignette, chromatic aberration, SSAO, or other screen-space effects with @react-three/postprocessing.
---

# R3F Post-Processing

Open `advanced/scaling-performance` and the post-processing package docs after checking `.cursor/skills/web-r3f-fundamentals/references/llm.txt`.

## Recommended Routes

- GPU budget and effect-pass cost review: [Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- Scene anti-patterns that make post-processing heavier than necessary: [Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- Root renderer settings, color pipeline, and fallback behavior: [Canvas](https://r3f.docs.pmnd.rs/api/canvas)
- Base scene examples before adding screen-space polish: [Examples](https://r3f.docs.pmnd.rs/getting-started/examples)

## Use this skill when

- Adding screen-space effects such as bloom, depth of field, vignette, or noise
- Deciding how `EffectComposer` should fit into the scene tree
- Debugging washed-out output, glow thresholds, or effect ordering
- Balancing visual polish against GPU cost

## Workflow

1. Add effects only after the base scene, lighting, and materials already read correctly.
2. Introduce one effect at a time and verify its visual purpose.
3. Keep `EffectComposer` placement explicit and close to root scene ownership.
4. For bloom, make emissive and tone-mapping decisions intentional rather than accidental.
5. Re-test performance after each added pass or multisampling increase.

## Guardrails

- Do not use post-processing to patch a weak lighting or material setup.
- Do not stack many heavy effects without measuring the GPU cost.
- Do not make competitive or gameplay-critical visuals harder to read for style alone.

## Done when

- Each pass has a clear reason to exist.
- Effect ordering and thresholds are understandable.
- The scene looks better without avoidable GPU waste.
