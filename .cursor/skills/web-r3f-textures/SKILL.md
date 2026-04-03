---
name: web-r3f-textures
description: React Three Fiber texture workflows for Cursor. Use when loading images with useTexture or useLoader, configuring repeats and filters, applying PBR texture sets, or working with environment maps and texture color space.
---

# R3F Textures

Open `tutorials/loading-textures`, `api/objects`, and `tutorials/v9-migration-guide` from `.cursor/skills/web-r3f-fundamentals/references/llm.txt` before texture-heavy work.

## Recommended Routes

- Base texture loading and map application: [Loading Textures](https://r3f.docs.pmnd.rs/tutorials/loading-textures)
- Material property wiring, `attach`, and JSX object semantics: [Objects](https://r3f.docs.pmnd.rs/api/objects)
- Loader behavior, preload, multi-texture loading: [Hooks](https://r3f.docs.pmnd.rs/api/hooks)
- Texture color-management changes in modern R3F: [v9 Migration Guide](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide)

## Use this skill when

- Loading one or more textures onto a material
- Applying PBR maps such as color, normal, roughness, metalness, AO, or displacement
- Configuring wrap, repeat, filtering, anisotropy, or environment maps
- Fixing texture color-space problems after newer R3F or three.js changes

## Workflow

1. Prefer `useTexture` for ergonomic scene usage and `useLoader(TextureLoader, ...)` when you need lower-level control.
2. Group related PBR maps together and keep the material contract readable.
3. Configure wrapping, repeat, and filtering immediately after load when the scene depends on it.
4. Confirm color textures versus data textures are treated appropriately for current R3F and three.js behavior.
5. Reuse and preload heavy textures when the same scene revisits them often.

## Guardrails

- Do not scatter related texture maps across many files without a clear material boundary.
- Do not guess about texture color space in upgraded projects.
- Do not over-subdivide geometry for displacement unless the scene truly benefits from it.

## Done when

- Texture ownership and map usage are explicit.
- Configuration happens near load time.
- Materials render with the intended color and surface detail.
