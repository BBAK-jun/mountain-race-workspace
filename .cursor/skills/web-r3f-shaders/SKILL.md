---
name: web-r3f-shaders
description: React Three Fiber shader workflows for Cursor. Use when building shaderMaterial components, writing GLSL, updating uniforms, creating vertex displacement, or extending built-in materials with custom shader logic.
---

# R3F Shaders

Open `api/typescript`, `api/additional-exports`, and `tutorials/how-it-works` from `.cursor/skills/web-r3f-fundamentals/references/llm.txt` before custom shader integration.

## Recommended Routes

- Renderer internals, object creation, and attachment model: [How Does It Work?](https://r3f.docs.pmnd.rs/tutorials/how-it-works)
- Custom JSX elements, declaration merging, and typed shader components: [TypeScript](https://r3f.docs.pmnd.rs/api/typescript)
- `extend`, `createRoot`, portals, and lower-level integration points: [Additional Exports](https://r3f.docs.pmnd.rs/api/additional-exports)
- Modern WebGPU and async `gl` considerations for custom rendering work: [Canvas](https://r3f.docs.pmnd.rs/api/canvas), [v9 Migration Guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)

## Use this skill when

- Writing custom vertex or fragment shaders
- Creating `shaderMaterial` components with uniforms
- Updating uniforms from `useFrame`
- Extending or replacing stock materials with custom GPU behavior

## Workflow

1. Decide whether a stock material, helper material, or custom shader is truly required.
2. Prefer `shaderMaterial` plus `extend` for reusable scene components.
3. Keep uniforms typed, named clearly, and updated from a small number of owners.
4. Isolate shader code so mesh structure and shader logic can be reviewed separately.
5. For TypeScript, declare custom JSX elements explicitly when extending the catalog.

## Guardrails

- Do not reach for shaders when stock PBR or helper materials already solve the task.
- Do not hide many side effects in uniform update code.
- Do not couple shader internals tightly to unrelated gameplay state.

## Done when

- Shader ownership and uniform flow are explicit.
- JSX integration is typed and predictable.
- The custom GPU work justifies its complexity.
