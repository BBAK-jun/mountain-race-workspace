---
name: web-r3f-physics
description: React Three Fiber physics workflows for Cursor. Use when integrating @react-three/rapier, RigidBody, colliders, collision events, joints, or physics-driven scene interactions in R3F.
---

# R3F Physics

Open `advanced/scaling-performance` and the Rapier package docs after checking `.cursor/skills/web-r3f-fundamentals/references/llm.txt`.

## Recommended Routes

- Frame budget, on-demand rendering, and simulation cost strategy: [Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- Fast-state and per-frame mutation anti-pattern review: [Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- Root scene and frameloop semantics around active simulations: [Canvas](https://r3f.docs.pmnd.rs/api/canvas), [Hooks](https://r3f.docs.pmnd.rs/api/hooks)
- Object declaration and attachment semantics when pairing colliders with visible meshes: [Objects](https://r3f.docs.pmnd.rs/api/objects)

## Use this skill when

- Adding gravity, rigid bodies, colliders, sensors, or joints
- Choosing collider strategies for gameplay objects or terrain
- Wiring physics updates back into visible scene behavior
- Debugging unstable bodies, tunneling, sleeping, or expensive simulations

## Workflow

1. Define which objects are dynamic, fixed, kinematic, or sensor-only.
2. Choose the simplest collider shape that preserves intended gameplay.
3. Keep render meshes and physics ownership understandable, especially for compound bodies.
4. Use debug views while tuning, then remove or disable them for normal use.
5. Re-check performance and frameloop behavior once the simulation is active.

## Guardrails

- Do not default to expensive trimesh or overly detailed colliders without need.
- Do not hide physics writes across many unrelated hooks.
- Do not let visual transforms and physics transforms fight each other.

## Done when

- Body type and collider choices are explicit.
- Simulation behavior is stable and reviewable.
- Physics cost matches the gameplay value.
