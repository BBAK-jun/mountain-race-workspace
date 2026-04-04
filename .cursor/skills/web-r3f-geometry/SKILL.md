---
name: web-r3f-geometry
description: React Three Fiber geometry workflows for Cursor. Use when creating mesh shapes, custom BufferGeometry, path-based geometry, point clouds, lines, or instanced geometry for scene performance.
---

# R3F Geometry

Open `api/objects` and `advanced/scaling-performance` from `.cursor/skills/web-r3f-fundamentals/references/llm.txt` first.

## Recommended Routes

- Built-in geometry JSX mapping, `args`, `attach`, and reuse semantics: [Objects](https://r3f.docs.pmnd.rs/api/objects)
- Instancing, reuse, and scene-scale geometry performance: [Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- Common geometry-related React anti-patterns: [Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)
- Reconciler internals when custom geometry attachment gets confusing: [How Does It Work?](https://r3f.docs.pmnd.rs/tutorials/how-it-works)

## Use this skill when

- Choosing built-in geometries such as box, sphere, plane, capsule, or torus
- Building custom `BufferGeometry` or attributes
- Extruding, lathing, or otherwise generating procedural shapes
- Using instancing to render many similar objects efficiently

## Workflow

1. Prefer built-in geometry JSX elements when they express the shape cleanly.
2. Move complex geometry construction into memoized factories or helper components.
3. Reach for instancing when object count, not scene semantics, is the real bottleneck.
4. Keep geometry generation separate from material and interaction concerns where possible.
5. Reuse geometry objects when many meshes share the same form.

## Guardrails

- Do not recreate heavy geometry every render.
- Do not use high-detail segmentation without a specific shading or displacement reason.
- Do not choose instancing if each object still needs wildly different scene behavior.

## Done when

- Shape ownership is clear.
- Reuse versus uniqueness is intentional.
- Geometry cost matches the visual or gameplay need.
