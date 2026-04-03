---
name: web-r3f-loaders
description: React Three Fiber asset loading patterns for Cursor. Use when loading GLTF, FBX, OBJ, HDRI, or texture assets with useGLTF, useLoader, Suspense, preloading, and asset reuse patterns.
---

# R3F Loaders

Open `tutorials/loading-models`, `tutorials/loading-textures`, `api/hooks`, and `advanced/scaling-performance` from `.cursor/skills/web-r3f-fundamentals/references/llm.txt` first.

## Recommended Routes

- Model-loading flow, `primitive`, `Suspense`, generated JSX models: [Loading Models](https://r3f.docs.pmnd.rs/tutorials/loading-models)
- Texture-loading flow and map assignment: [Loading Textures](https://r3f.docs.pmnd.rs/tutorials/loading-textures)
- Loader hooks, preload, multi-asset loading, GLTF handling: [Hooks](https://r3f.docs.pmnd.rs/api/hooks)
- Asset reuse and cache-aware performance work: [Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

## Use this skill when

- Loading models, HDR environments, textures, or other external assets
- Choosing between `useGLTF`, `useLoader`, and generated JSX model components
- Setting up `Suspense`, preload paths, or shared asset reuse
- Debugging asset ownership, post-load processing, or cache behavior

## Workflow

1. Prefer `useGLTF` for GLTF/GLB and `useLoader` for other three.js loaders.
2. Use `Suspense` boundaries intentionally and keep fallbacks explicit.
3. Preload repeat assets at module scope when the same route or scene reuses them.
4. If a model becomes core UI structure, consider `gltfjsx`-style generated JSX rather than mounting the raw scene forever.
5. Reuse loaded assets and document any traverse-time mutation done after loading.

## Guardrails

- Do not instantiate raw loaders ad hoc on every render.
- Do not duplicate the same asset URL across components without relying on the loader cache.
- Do not hide expensive post-load mutation in random effects with unclear ownership.

## Done when

- The asset path, loader choice, and fallback behavior are obvious.
- Reuse and preload decisions are intentional.
- Loaded content is easy to mount, inspect, and extend.
