Mercury/Venus/Mars surfaces use a project-local `TextureBump` node instead of stock `@triforge/shader-core` `Bump({method:'uv-offset'})` — blocked on an upstream bug, not a design choice.

**What:** `Bump({method:'uv-offset'})` emits `#extension GL_EXT_shader_texture_lod : enable` after other shader code (ESSL3/WebGL2 rejects this). Reported upstream twice (0.4.0, 0.4.1 re-test) — 0.4.1 only moved the bug, now preceded by a `luminance()` helper THREE.js itself injects, still landing after the extension line.
**Why it matters:** `TextureBump` is the last custom raw-GLSL node in `CoreShaderNodes.ts` — every other custom node has been retired as the library added proper equivalents (`RgbaOutput`→`MixShader`+`TransparentBSDF`, `UvPan`→parameter aliases). This is the one blocker left.
**Next action:** Once genuinely fixed upstream, migrate Mercury/Venus/Mars off `TextureBump` and delete it from `CoreShaderNodes.ts`.
