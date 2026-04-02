---
name: mountain-race-three-scene
description: Maintain the mountain race game's Three.js scene and renderer lifecycle. Use when editing scene setup, camera behavior, animation loops, resize handling, cleanup, or 3D performance for the race view.
---

# Mountain Race Three Scene

## Use this skill when

- Touching Three.js or canvas integration
- Changing camera follow behavior
- Debugging frame pacing or resource cleanup
- Improving readability of the 3D mountain course

## Workflow

1. Identify ownership of renderer, scene, camera, and loop.
2. Check mount, update, resize, and teardown paths.
3. Avoid recreating heavy Three.js objects unless necessary.
4. Keep camera motion readable for spectators.
5. Verify desktop and mobile behavior after scene changes.

## Guardrails

- Dispose of materials, geometries, and listeners on teardown.
- Keep render state separate from core gameplay state when possible.
- Add scene complexity only if frame rate and readability stay acceptable.

## Done when

- Lifecycle behavior is explicit.
- Cleanup is handled.
- The scene still supports the intended game feel without obvious jank.
