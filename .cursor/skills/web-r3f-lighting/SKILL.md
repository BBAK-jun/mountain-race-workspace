---
name: web-r3f-lighting
description: React Three Fiber lighting workflows for Cursor. Use when adding light rigs, configuring shadows, using Environment-based lighting, or balancing lighting quality and performance in R3F scenes.
---

# R3F Lighting

Open `api/canvas`, `advanced/scaling-performance`, and relevant environment-texture routes from `.cursor/skills/web-r3f-fundamentals/references/llm.txt` first.

## Recommended Routes

- Root shadow, tone-mapping, and renderer defaults: [Canvas](https://r3f.docs.pmnd.rs/api/canvas)
- Texture and environment-map support for image-based lighting: [Loading Textures](https://r3f.docs.pmnd.rs/tutorials/loading-textures)
- Lighting cost, on-demand rendering, and scaling choices: [Scaling Performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- Scene-level performance anti-patterns that often show up with bad light rigs: [Performance Pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)

## Use this skill when

- Choosing or adjusting ambient, hemisphere, directional, point, spot, or area lights
- Configuring shadows, shadow cameras, or shadow performance
- Using HDRI or `Environment`-style image-based lighting
- Debugging flat, noisy, overblown, or too-expensive scene lighting

## Workflow

1. Define the key light, fill light, and ambient strategy before adding decorative lights.
2. Keep shadows enabled only where they materially improve the shot or gameplay readability.
3. Prefer environment lighting when it simplifies the scene and improves material response.
4. Tune shadow map sizes and camera bounds against the actual playable or visible area.
5. Re-check frame cost after every major lighting upgrade.

## Guardrails

- Do not compensate for bad material setup by piling on more lights.
- Do not leave oversized shadow maps or overly broad shadow frustums unexplained.
- Do not make lighting so stylized that gameplay readability drops.

## Done when

- The lighting hierarchy is intentional.
- Shadow cost matches scene needs.
- Materials and scene depth read clearly without avoidable performance waste.
