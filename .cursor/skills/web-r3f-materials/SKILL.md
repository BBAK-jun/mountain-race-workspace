---
name: web-r3f-materials
description: React Three Fiber material workflows for Cursor. Use when choosing mesh materials, applying PBR settings, wiring texture maps, using Drei material helpers, or refactoring mesh styling in scene components.
---

# R3F Materials

Open `api/objects`, `tutorials/loading-textures`, and any shader-specific route from `.cursor/skills/web-r3f-fundamentals/references/llm.txt` as needed.

## Recommended Routes

- JSX material declaration, `attach`, and prop semantics: [Objects](https://r3f.docs.pmnd.rs/api/objects)
- Texture-map-driven materials and PBR input setup: [Loading Textures](https://r3f.docs.pmnd.rs/tutorials/loading-textures)
- Shader crossover work for custom materials: [How Does It Work?](https://r3f.docs.pmnd.rs/tutorials/how-it-works), [TypeScript](https://r3f.docs.pmnd.rs/api/typescript)
- Performance review for expensive materials or too many unique instances: [Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

## Use this skill when

- Picking between `meshBasicMaterial`, `meshStandardMaterial`, `meshPhysicalMaterial`, toon, or custom material types
- Tuning PBR properties such as roughness, metalness, transmission, clearcoat, or emissive response
- Integrating helper materials from Drei
- Cleaning up inconsistent visual styling across meshes

## Workflow

1. Choose the simplest material that can express the desired look.
2. Keep material props close to the mesh or abstract them into reusable material components when repeated.
3. Treat texture maps and material numeric values as one contract, not separate concerns.
4. Use physical features such as transmission or clearcoat only when the scene lighting supports them.
5. Push into `web-r3f-shaders` only when stock and helper materials stop being enough.

## Guardrails

- Do not default everything to `meshPhysicalMaterial` without a concrete visual need.
- Do not mix many unrelated styling concerns into one giant material wrapper.
- Do not hide expensive reflective or transmissive materials in performance-sensitive scenes without review.

## Done when

- Material choice is justified by the visual goal.
- PBR settings and texture maps make sense together.
- The scene styling is reusable and readable.
