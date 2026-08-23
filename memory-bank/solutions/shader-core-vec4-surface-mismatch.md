Symptom: every planet rendered as a flat, textureless "ghost" sphere — atmosphere fresnel visible, no real surface texture/shading.

**Root cause:** `@triforge/shader-core` 0.3.0 made `MaterialOutput.surface` require a `shader` socket (vec4), but all 8 planet surface builders fed it a plain `Gamma` output (vec3) — a real dimension-mismatch shader compile failure (`gl_FragColor = <vec3>`), confirmed via headless-browser `THREE.WebGLProgram: Shader Error 0`. WebGL silently fails to render the mesh's real material, leaving only the atmosphere shell visible.
**Fix:** Wrap each surface's final `Gamma` output through an `Emission` pass-through (`color * 1.0`, legitimately vec4) before `MaterialOutput`, in all 8 `{Planet}Surface.ts` files.
**How to spot again:** Any future shader-core version bump — check `MaterialOutput` socket types against what surface builders actually output before assuming a visual regression is a content/texture bug.
