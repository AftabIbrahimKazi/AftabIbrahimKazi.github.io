# Memory Bank Index

## Decisions
- [Shared-node promotion rule](decisions/shared-node-promotion-rule.md) — shader-node helpers promote to CoreShaderNodes.ts only on a 2nd real consumer, never speculatively
- [Sphere geometry stays native](decisions/sphere-geometry-stays-native.md) — radius-parametric-geometry reverted (UV seam tear on Saturn/Uranus/Neptune), all planets use THREE.SphereGeometry
- [Git ladder must not be skipped](decisions/git-ladder-must-not-be-skipped.md) — dev→test→beta→main always; a PR was once merged straight to main by mistake

## Context
- [TextureBump upstream bug](context/texturebump-upstream-bug.md) — last custom GLSL node left in CoreShaderNodes.ts, blocked on a triforge shader-core extension-ordering bug

## Solutions
- [shader-core vec4 surface mismatch](solutions/shader-core-vec4-surface-mismatch.md) — "ghost planet" flat-sphere bug, MaterialOutput.surface needs vec4 not vec3
- [Warp veil bfcache flash](solutions/warp-veil-bfcache-flash.md) — raw page flash before warp plays, fixed via default-opaque veil + pagehide listener
- [Render-budget probe evicts WebGL context](solutions/render-budget-probe-evicts-webgl-context.md) — nebula went blank when hardware-ceiling probing ran after a real renderer existed
- [Overlay click planet routing](solutions/overlay-click-planet-routing.md) — sidebar clicks all resolved to Saturn until routed via explicit data-planet attribute instead of DOM traversal
