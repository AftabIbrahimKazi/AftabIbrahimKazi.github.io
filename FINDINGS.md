# Triforge Findings

Gaps discovered while using triforge packages in real projects. To be addressed in future updates.

---

## st-shader-core

Source: Exo Space Planetarium (`Astro/planatarium-2`), which had to define three project-local custom nodes in `src/scripts/shader-nodes/CoreShaderNodes.ts` and `src/scripts/warp/WarpShaderNodes.ts`. Two of the three are missing library features.

### 1. No per-fragment alpha path to the material output — RESOLVED in 0.3.0 ✅

> **Resolved (verified against published 0.3.0, 2026-07-07):** monorepo PR #11 (`bd6f557`) implemented option (a) from the Fix #1 spec — shader sockets widened to vec4 so alpha travels from `PrincipledBSDF` through the graph to `MaterialOutput`. Verified on the installed npm package: the reproducer now passes (`PrincipledBSDF({ alpha: 0.5 })` → compiled material `transparent: true`, fragment carries the alpha, no hardcoded `vec4(sv, 1.0)`); socket-driven fresnel alpha registers a live uniform + marks transparent; default alpha stays opaque (regression guard holds). Blast radius handled: `AddShader` takes max alpha, `MixShader` blends alpha via vec4 mix, `ShaderToRGB` extracts the real alpha — 7 new FIX #1 tests, 78/78 pass. **Site compatibility verified on 0.3.0:** all 7 planetarium material builders (planet surface/atmosphere/clouds, warp, carousel sun/atmo incl. every custom node) compile clean, `astro build` passes. `RgbaOutput` can now be retired — migration + a browser visual pass still pending (node-side compile ≠ GPU link; eyeball warp/atmospheres before committing the migration).

> Historical: the first attempt (0.2.1) failed — analysis kept below for the record.
> **Re-verified against published 0.2.1 (2026-07-07): NOT fixed for compiled node graphs.** The alpha work only reached MaterialOutput's `MeshPhysicalMaterial` conversion path (`opacity`/`transparent` set there, `MaterialOutput.ts` ~L116–123). The **`compile()` ShaderMaterial path — the one this finding is about — still emits `gl_FragColor = vec4(sv, 1.0)`** (`MaterialOutput.ts` compileCall), and in the GLSL `_st_principledBSDF(... float alpha ...)` the alpha parameter is accepted but **never used in the function body** (returns vec3; alpha discarded). Smoke-tested on published 0.2.1: `PrincipledBSDF({ alpha: 0.5 })` → compiled material `transparent: false, opacity: 1`. `RgbaOutput` must NOT be retired yet. Remaining work: a `shader` output that carries alpha (vec4, or a paired alpha chain), `compileCall` emitting `vec4(sv, alphaExpr)`, and `transparent: true` on the compiled material when alpha ≠ 1 is reachable — see Fix #1 spec below; the smoke-test in that spec must pass on the *compiled* material.

`MaterialOutput` hardcodes alpha to 1.0, so a graph cannot express fresnel- or terminator-driven transparency. The consumer had to write a custom `RgbaOutput` node emitting `gl_FragColor = vec4(color, alpha)`.

**Blender reference:** alpha flows through the Alpha input on Principled BSDF (or Transparent BSDF + Mix Shader), not through Material Output. `PrincipledBSDF` already has an `alpha` input socket — the Blender-faithful fix is to plumb that alpha end-to-end through `MaterialOutput`, rather than adding a new RGBA output node.

### 2. Nothing can feed `ImageTexture.vector` — RESOLVED in repo (2026-07-07)

> **Resolved (verified 2026-07-07):** `CompileContext.typesCompatible`/`resolveInput` now implicitly convert `color`/`shader` (vec3) ↔ `vector` (vec2) at the connection point (`.xy` narrowing, `vec3(v, 0.0)` widening) — `st-shader-core/src/core/CompileContext.ts`. `ImageTexture.compileCall` now goes through `resolveInput` instead of a raw `ctx.outputVar` call so the conversion actually applies. `Mapping`'s `location`/`rotation`/`scale` were also converted from baked constructor literals to live `color`-typed uniform inputs (`node.parameters.location` etc.), so the canonical `TextureCoordinate → Mapping → ImageTexture` panning graph now compiles and is animatable — the project-local `UvPan` node can be retired. 2 regression tests added (`st-shader-core/test/run-tests.js`, 68 tests pass). **Published in 0.2.1 and verified against the installed package (2026-07-07): the canonical TextureCoordinate → Mapping → ImageTexture graph compiles and `map.parameters.location` is live post-compile.**

`vector` sockets are vec2, but every transform node (including Mapping) outputs vec3 `color`, so no node can legally drive texture UVs. This blocks the canonical UV-panning setup, and `THREE.Texture.offset` is ignored by raw ShaderMaterials. The consumer had to write a custom `UvPan` node with float x/y uniform inputs.

**Blender reference:** Texture Coordinate (UV) → Mapping (Location offset) → Image Texture Vector is the standard panning graph; Mapping's vector sockets carry 2D UVs fine. Fix: make vector-ish outputs (Mapping et al.) compatible with `vector` inputs. That makes a dedicated UvPan node unnecessary.

### 3. No loop construct — PARTIALLY RESOLVED in repo

> **Note (2026-07-07):** a generic escape-hatch node already exists in the monorepo as `ShaderScript` (`st-shader-core/src/nodes/process/ShaderScript.ts`), matching the spirit of the `GlslScript` proposal below (manifest-driven `inputs`/`outputs`, developer-authored `glsl`/`defs` body, auto socket/uniform wiring). It predates this finding and wasn't previously cross-referenced here. I added `assertGlslIdentifier` validation on its input/output socket names (they were previously interpolated unchecked as GLSL local-variable names) plus 2 SECURITY regression tests. Not yet verified against the `WarpStarfield` port described in part A below — that migration is still open.

### 3. No loop construct — by design, but the escape hatch is generalisable

The planetarium's warp star field is a 16-layer × 3×3-cell raymarch loop, implemented as a custom `WarpStarfield` node with hand-written GLSL. Blender's shader editor also has no loops (Repeat Zones are Geometry Nodes only); its escape hatch is the OSL Script node, which is exactly what the custom-node API is. The loop itself needs no fix — but the escape hatch can be generalised (below) so future loop-based effects don't need a node subclass each.

#### Generalisation path — two complementary levels

**A. Generalise the mechanism: add a generic `GlslScript` node to shader-core.** ~90% of the `WarpStarfield` class is mechanical boilerplate: typed input-socket declarations, output declarations, and a `compileCall` that only resolves inputs into a function call and assigns outputs. Only `compileDefs` (the GLSL function) is unique. A library node of the shape:

```ts
new GlslScript({
  defs: `vec4 myEffect(vec2 uv, float speed, ...) { /* loops fine here */ }`,
  call: 'myEffect',
  inputs:  { speed: 'float', time: 'float', tint: 'color' },
  outputs: { Color: 'color', Lum: 'float' },
})
```

would auto-generate the sockets, uniform wiring, collision-safe name prefixing, and output-variable assignment. Direct analogue of Blender's OSL Script node, so it fits the design philosophy. Every future loop-based effect (nebula raymarch, volumetric clouds, rain streaks) then needs zero subclass code — just a GLSL string plus a socket manifest. **This is the high-leverage fix and belongs in shader-core.** It would also let the planetarium delete the `WarpStarfield` class shell (the GLSL survives as data).

**B. Generalise the visual: parameterise the starfield into a `LayeredParticleField` node.** The warp look is controlled by hardcoded constants (layer count, cell size, layer spacing, focal length, near/far clipping) plus baked-in choices — quadratic speed→trail mapping and a three-band hardcoded star palette. Promoting those to node options/inputs makes the same loop produce different visuals: trail ≈ 0 gives a calm drifting starfield (the dot-rendering branch already exists); reparametrised cell/spacing/speed gives snow, rain streaks, depth dust, or slower hyperspace; the palette bands become color inputs. **Do this only when a second effect actually wants the layered-grid projection** — generalising parameters before a second consumer exists tends to guess the wrong knobs.

### 4. No tangent-space normal mapping — RESOLVED in repo (2026-07-07)

> **Resolved (verified 2026-07-07):** `NormalMap` was rewritten to be a true tangent-space texture decoder (`st-shader-core/src/nodes/process/NormalMap.ts`): inputs `color` (RGB from `ImageTexture.Color`, still [0,1]) and `strength`; decodes `n = color*2-1`, builds a derivative-based cotangent frame (Schüler method, no vertex `tangent` attribute required — reuses the same `dFdx`/`dFdy` technique the existing `Bump` node already used, per the fallback this finding suggested) and returns `normalize(TBN * n)`. The old height-gradient behaviour (which duplicated `Bump`) is gone; no other code in this monorepo referenced the old `fac`-based signature, so this was a clean break, not aliased. 2 regression tests added (compiles + strength=0 case). The Earth conversion can re-add `8k_earth_normal_map.jpg`: `new NormalMap({ color: new ImageTexture({ uniformName: 'uNormalMap' }).output('Color'), strength: 0.75 })` → `PrincipledBSDF({ normal: ... })`. **Published in 0.2.1 and verified against the installed package (2026-07-07): the graph compiles and the derivative TBN construction is present in the fragment shader.**

The `NormalMap` node is a procedural height-gradient node (`dFdx`/`dFdy` of a float Fac input), not texture normal mapping. It cannot consume a baked tangent-space normal texture (RGB channels encoding normal vectors relative to the UV tangent frame): there is no node that decodes RGB → vector, no tangent attribute in the generated vertex shader, and no TBN matrix construction to rotate sampled vectors into world space. The Earth conversion had to drop `8k_earth_normal_map.jpg` (was `normalScale 0.75` under `onBeforeCompile`) and approximate with the project-local `TextureBump` height-difference node — directional surface detail (ridges/crater walls lit correctly per light angle) is lost.

**Blender reference:** Image Texture (Non-Color) → Normal Map node (Tangent Space, Strength) → Normal input on Principled BSDF. Blender's Normal Map node *is* the tangent-space decoder; the height-gradient behaviour lives in the separate Bump node. Fix: rename the current node to match its Bump semantics (or keep both), add a true `NormalMap` node (sample RGB, `* 2.0 - 1.0`, apply strength, transform by TBN), and emit `tangent` attribute + TBN construction in the vertex shader generator when the node is present. Geometry without tangents needs `BufferGeometryUtils.computeTangents()` or a derivative-based TBN fallback (as three.js does for `ShaderMaterial`-style perturbation).

### 5. No ambient / world lighting — RESOLVED in repo

> **Resolved (verified 2026-07-07):** `PrincipledBSDF` adds `uAmbientColor * base` outside the N·L term (`st-shader-core/src/nodes/process/PrincipledBSDF.ts`), so night-side/away-facing fragments now receive a constant ambient fill instead of reading pure black. The consumer-side workaround (`surfaceTex × ambientStrength` per surface graph) is no longer needed — set `ambient` on `PrincipledBSDF` from the scene's `EnvironmentManager` ambient colour instead. **Published in 0.2.1 and verified against the installed package (2026-07-07): `uAmbientColor * base` sits outside the N·L term in the compiled fragment shader.** Full IBL (`scene.environment` sampling) remains the explicit non-goal noted below. Consumer follow-up in this repo: pass `ambient` in each `{Planet}Surface.ts` builder + retune night tints at a visual pass — not yet done.

Compiled materials are raw `ShaderMaterial`s with no scene-light integration: the only illumination a graph receives is what it explicitly computes (e.g. `PrincipledBSDF`'s `uSunDirection` uniform). A scene `AmbientLight` contributes nothing. Live regression in the planetarium: pre-conversion the planets were `MeshStandardMaterial`s receiving the EnvironmentManager's faint ambient, which gave night hemispheres a dim texture-lit fill; post-conversion the night side renders only each surface's tiny hardcoded `nightTint` emission constant (tuned when ambient still existed underneath), so Jupiter/Saturn/Uranus/Neptune night regions read pitch black. Consumer-side workaround (not yet applied): add `surfaceTex × ambientStrength` post-terminator in each surface graph.

**Blender reference:** the World (Background shader) always contributes environment lighting — no material opts in. Fix candidates, either or both: an `ambient` input on `PrincipledBSDF` (cheap constant term: `ambientColor × baseColor` added to the direct-light result), and/or a `WorldEnvironment`/`AmbientLight` input node so graphs can read scene-level light color/intensity as uniforms. Full IBL (`scene.environment` cubemap sampling) is the eventual endgame but the constant ambient term alone resolves the night-side class of bug.

### 6. GLSL injection via texture `uniformName` — security — RESOLVED in repo (npm publish pending)

> **Resolved 2026-07-06** — monorepo commit `1191af7` (PR #3): `assertGlslIdentifier(inputs.uniformName, …)` added in both constructors + 4 regression tests (62 shader-core tests pass). Verified. **Published 2026-07-07 as 0.1.2** (shader-core, animation-core, compositor-core); planetarium updated to 0.1.2 and dist verified to contain the guards + SafeExpression. The npm-publish caveat below is closed.

The 2026-07-06 security patch (triforge monorepo commit `a3d260f`, merged in PR #2) added `assertGlslIdentifier` at two of the three places a caller-supplied string reaches generated GLSL: the `CompileContext` vertex-injection chokepoint (attribute/varying names) and the `Attribute` node constructor. The third is still open: `ImageTexture` and `EnvironmentTexture` interpolate their required `uniformName` option verbatim into shader source with no validation —

- `st-shader-core/src/nodes/process/ImageTexture.ts` — `uniform sampler2D ${this.uniformName};` (compileDefs) and `texture2D(${this.uniformName}, …)` (compileCall)
- `st-shader-core/src/nodes/process/EnvironmentTexture.ts` — `uniform samplerCube ${this._uniformName};` and `textureCube(${this._uniformName}, …)`

A hostile `uniformName` (e.g. `` `uTex; } /* arbitrary GLSL */` ``) lands directly in the shader. Same vulnerability class, same attack, same one-line fix as the patched `Attribute` path: call `assertGlslIdentifier(inputs.uniformName, '<Node> uniformName')` in each constructor, plus matching regression tests in `st-shader-core/test/run-tests.js` (mirror the two Attribute SECURITY tests). Only exploitable if an app passes untrusted input as a `uniformName` — all current consumers use hardcoded literals — but it violates the ecosystem rule the patch itself cites ("NEVER interpolate user-supplied strings directly into GLSL").

**Also pending: npm publish.** All three security fixes (and this one, once made) exist only in the monorepo — npm still serves `@triforge/*` 0.1.1 (published 2026-06-20, pre-patch), so every consumer incl. this planetarium runs unpatched code until a new version ships.

### 7. Emission-based graphs still have no alpha path — missing feature (blocks `RgbaOutput` retirement)

Found 2026-07-07 while migrating the planetarium onto 0.3.0. The vec4 shader-socket work (finding #1) gave **only `PrincipledBSDF`** an alpha input. `Emission.compileCall` still emits `vec4(_st_emission(color, strength), 1.0)` — alpha hardcoded — and there is **no `TransparentBSDF` node** in the package. So a pure-emission graph with computed transparency (every planet atmosphere: fresnel × terminator drives *both* glow strength and alpha; also cloud shells, warp veil) cannot express its alpha through library nodes. The planetarium's custom `RgbaOutput` node therefore **cannot be retired** and remains in `CoreShaderNodes.ts`.

**Blender reference:** the canonical alpha route for emission materials is Transparent BSDF + Mix Shader (fac = alpha). Fix candidates, either or both: (a) add `TransparentBSDF` (emits `vec4(0,0,0,0)`, or `vec4(color, 0)` premultiplied per Blender semantics) so `MixShader(fac, TransparentBSDF, Emission)` produces the alpha via the existing vec4 mix — Blender-faithful; (b) pragmatic: an `alpha` input on `Emission` mirroring PrincipledBSDF's. Acceptance test: rebuild `buildJupiterAtmosphereMaterial` (this repo, `objects/solar-system/jupiter/JupiterAtmosphere.ts`) without `RgbaOutput`.

### 8. `Mapping` array parameters are not keyframe-animatable — blocks `UvPan` retirement

Found 2026-07-07. Finding #2's fix made `Mapping.location/rotation/scale` live uniforms via `node.parameters` — but they are **whole-array parameters** (`parameters.location = [x, y, z]`), while `@triforge/keyframe`'s `KeyframeTrack(target, property, ...)` animates a **scalar property on a target object** (all planet animations do `new KeyframeTrack(surfacePan, 'x', ...)`). There is no way to point a track at one component of an array parameter, and writing a fresh 3-element array every frame from an adapter object defeats the wired-uniform design. So the canonical `TextureCoordinate → Mapping → ImageTexture` graph is usable for *static* transforms but not for the animated texture panning every gas giant + the sun needs — the project-local `UvPan` node (float `x`/`y` parameters, directly trackable) **cannot be retired**.

**Fix candidates:** (a) in shader-core, expose per-component parameter aliases for vector inputs (e.g. `parameters['location.x']` or `parameters.locationX` backed by the same uniform) — smallest change, keyframe needs nothing; (b) in keyframe, support component paths (`new KeyframeTrack(params, 'location[0]', ...)`). Acceptance test: port `JupiterSurface.ts`'s UvPan + `JupiterAnimation.ts`'s tex-pan tracks to Mapping and confirm the pan still runs.

---

## Site migration to 0.3.0 APIs — done 2026-07-07

- **Night-side fix shipped (finding #5 consumer side):** `buildNightAmbient` added to `CoreShaderNodes.ts` — `texture × 0.05 × (1 − terminator)` added post-terminator, so night hemispheres show dim surface detail. Wired into all 8 surface builders. Note: the library's `uAmbientColor` (default `0.05, 0.08, 0.18`) is **explicitly zeroed** in every surface builder — the graphs' terminator multiply would kill it at night anyway, and the day side was tuned without it. Strength 0.05 is a starting value — retune per planet at a visual pass.
- **Earth normal map restored (finding #4 consumer side):** `8k_earth_normal_map.jpg` (2.8 MB) copied back from the archive; `EarthSurface.ts` uses the real `NormalMap` node (strength 0.75, as pre-conversion) replacing the `TextureBump` day-map-luminance stand-in. Perf follow-up: downscale/convert the normal map (near-lossless — it's vector data) in the texture pass.
- **Not migrated, by necessity:** `RgbaOutput` (finding #7) and `UvPan` (finding #8) stay. `TextureBump` also stays for Mercury/Venus/Mars (their relief legitimately derives from surface luminance; only Earth had a real normal map).
- **Browser visual pass still pending** — night ambience level, Earth relief direction (check a known mountain range lights correctly; if inverted, the normal map's green channel needs flipping), and general 0.3.0 vec4 regression sweep.

---

## Implementation specs — how to fix findings #1–#5 in the triforge monorepo

Written for a future Claude session working in the triforge monorepo (`c:\wamp64\www\My Projects\3D\three-js`, packages prefixed `st-`, published as `@triforge/*`). Reference implementations for most of these already exist as project-local custom nodes in this repo (`src/scripts/shader-nodes/CoreShaderNodes.ts`, `src/scripts/warp/WarpShaderNodes.ts`) — port their logic, don't reinvent it. Every fix must stay Blender-faithful (node names/socket semantics mirror Blender's shader editor), keep public APIs backward-compatible, and add regression tests to `st-shader-core/test/run-tests.js` (custom runner, `PASS/FAIL` lines — follow existing test style).

### Fix #1 — per-fragment alpha through MaterialOutput ⚠️ SECOND ATTEMPT — read the failure analysis first

> **Why the 0.2.1 attempt failed (verified 2026-07-07 against the published package):** `MaterialOutput` has **two independent code paths**, and the fix only landed on the wrong one.
>
> 1. **The `MeshPhysicalMaterial` conversion path** (`MaterialOutput.ts`, the `toFloat('alpha', 1.0)` block ~L116–123) — this correctly sets `opacity: alpha` and `transparent: alpha < 1.0 || isGlass`. But it only runs when a graph is converted to a stock three.js material, reading the BSDF node's *constructor literals*. Node graphs never use it.
> 2. **The `compile()` → `THREE.ShaderMaterial` path** — the one every real graph (and this finding) uses — was untouched. `MaterialOutput.compileCall` still ends `gl_FragColor = vec4(${sv}, 1.0);` (hardcoded alpha, last line of the file), and in `PrincipledBSDF.ts` the GLSL `_st_principledBSDF(vec3 base, float metallic, float roughness, float ior, float alpha, vec3 N)` **accepts `alpha` but never references it in the function body** — the function returns vec3, alpha is silently discarded. The socket, the uniform, and the function parameter all exist; the value goes nowhere.
>
> Reproducer (must pass on the *compiled* material after the real fix): `new MaterialOutput({ surface: new PrincipledBSDF({ alpha: 0.5 }).output('BSDF') }).compile()` — currently yields `material.transparent === false`, `opacity === 1`, and a fragment shader ending in `vec4(..., 1.0)`.

- **Where:** `st-shader-core/src/nodes/output/MaterialOutput.ts` (`compileCall`) **and** `st-shader-core/src/nodes/process/PrincipledBSDF.ts` (GLSL body + call site). The conversion-path code from 0.2.1 can stay — it's correct for what it does.
- **The structural problem to solve:** `BSDF` output sockets are `shader` type, compiled as **vec3** — there is no channel for alpha to travel from the BSDF node to the output node. Pick one:
  - **(a) Widen `shader` to vec4** — `_st_principledBSDF` returns `vec4(rgb, alpha)`; `compileCall` emits `gl_FragColor = ${sv};`. Cleanest data flow, but every node that consumes/produces `shader` sockets (`Emission`, `AddShader`, `MixShader`, all other BSDFs, `Gamma`/`VectorMath` when fed a shader — check each) must be updated in the same pass, and `AddShader`/`MixShader` must define alpha semantics (add: `max(a1, a2)` or saturate-sum; mix: `mix(a1, a2, fac)` — Blender mixes alpha with the shader).
  - **(b) Side-channel:** the BSDF's `compileCall` also emits `float ${outputVar}_alpha = ...;` and `MaterialOutput.compileCall` looks up `${sv}_alpha` when the upstream node declares it (declare via a marker on the node, not string sniffing). Smaller blast radius, no socket-type change, but pass-through nodes (`Gamma` etc.) between BSDF and output break the chain — document that alpha-carrying BSDFs must connect (directly or via shader-combining nodes that forward the alpha var) to `MaterialOutput`.
  - Option (a) is the Blender-faithful endgame; (b) is acceptable as an interim if (a)'s blast radius is too big for one release. Either way the reproducer above is the acceptance test.
- **Material flags:** when the resolved alpha is a uniform or any non-1.0 literal, the compiled `ShaderMaterial` needs `transparent: true` (and consider `depthWrite: false` guidance in docs — consumers currently set these post-compile; keep that working).
- **Reference:** `RgbaOutput` in this repo's `src/scripts/shader-nodes/CoreShaderNodes.ts` — a working `OutputNode` subclass emitting `gl_FragColor = vec4(color, alpha)` where `alpha` accepts a socket or a plain number. Every atmosphere, cloud shell, and the warp veil in this project runs on it today. Its test matrix is the feature's real-world acceptance suite.
- **Tests (all on the compiled ShaderMaterial, not the conversion path):** fragment source ends with the alpha expression, not `1.0`; `alpha: 0.5` literal → `transparent: true`, shader carries `0.5`; socket-driven alpha (fresnel chain) compiles and registers a live uniform; default (alpha omitted) produces byte-identical output to 0.2.1 — `vec4(sv, 1.0)` and `transparent: false` — so existing scenes don't repaint.
- **Downstream cleanup (this repo):** only after the reproducer passes on the installed npm package — migrate `RgbaOutput` call sites (all `{Planet}Atmosphere.ts`/`{Planet}Clouds.ts`, `EarthNight.ts`, `MarsDust.ts`, warp material) then delete `RgbaOutput`. Do not migrate on a repo build; finding #6's history shows why (repo-fixed ≠ shipped).

### Fix #2 — vector-socket compatibility so UVs can be driven (unblocks panning)

- **Where:** socket type-compat rules in `st-shader-core` core (wherever input/output GLSL types are matched — `CompileContext.resolveInput` / socket connection validation) + `Mapping` node.
- **What:** `vector` inputs are vec2 (`SOCKET_GLSL_TYPE`) but every transform node (incl. `Mapping`) outputs vec3 `color` — nothing can legally feed `ImageTexture.vector`. Blender's canonical panning graph is Texture Coordinate (UV) → Mapping (Location) → Image Texture Vector. Fix: allow vec3→vec2 implicit conversion at connection/resolve time (emit `.xy` swizzle), and/or give `Mapping` a proper vector output. Also add a `TextureCoordinate` input node (UV output) if none exists.
- **Reference:** `UvPan` in `CoreShaderNodes.ts` (float x/y inputs → live uniforms, emits `vUv + vec2(x, y)`). Its real value is *animatable* offsets — whatever design is chosen, `Mapping`'s location must be uniform-driveable via `node.parameters` post-compile (keyframe-compatible), because `THREE.Texture.offset` is ignored by raw ShaderMaterials.
- **Tests:** UV→Mapping→ImageTexture compiles; mutating the location parameter post-compile updates the uniform; vec3→vec2 swizzle emitted correctly.
- **Downstream cleanup:** `UvPan` used by every planet surface/cloud builder + carousel sun; migrate then delete.

### Fix #3 — generic `GlslScript` node (design task, not a bug)

- Spec already written in finding #3 above (inputs/outputs manifest + GLSL defs string, auto socket/uniform wiring, collision-safe prefixing). Analogue of Blender's OSL Script node. **Security note:** the `defs`/`call` strings are developer-authored GLSL by design (same trust level as writing a custom node class today) — but socket *names* from the manifest must go through `assertGlslIdentifier`, same as the 0.1.2 fixes.
- **Reference:** `WarpStarfield` in `src/scripts/warp/WarpShaderNodes.ts` — ~90% of it is the boilerplate this node would eliminate; port it as the acceptance test.

### Fix #4 — true tangent-space normal mapping

- **Where:** new node `st-shader-core/src/nodes/process/NormalMap.ts`… except the name is taken: the existing `NormalMap` node is a height-gradient bump (dFdx/dFdy of a float Fac). **Rename decision first:** Blender's actual node lineup is `Bump` (height→normal, what the current node does) and `Normal Map` (tangent-space RGB texture decode). If the current `NormalMap` duplicates the existing `Bump` node's behaviour, deprecate/alias it; the new tangent-space node should own the `NormalMap` name to stay Blender-faithful. Keep a re-export alias for 0.1.x compatibility.
- **What the new node does:** inputs `color` (RGB from an ImageTexture sampling the normal map — must be sampled linearly, no sRGB), `strength` (float, default 1.0); output `Normal` (vector). GLSL: `n = sampledRGB * 2.0 - 1.0; n.xy *= strength; normal = normalize(TBN * n)`.
- **The hard part is TBN plumbing:** the vertex-shader generator must (a) declare `attribute vec4 tangent`, (b) compute `vTangent`/`vBitangent` varyings (`bitangent = cross(normal, tangent.xyz) * tangent.w`), transformed by the same inverse-transpose model matrix as the normal, and (c) only emit this when a NormalMap node is present in the graph (use the existing vertex-injection mechanism that `Bump`/`Geometry` nodes use — the injection chokepoint in `CompileContext` already validates names). Document that geometry needs tangents: `BufferGeometryUtils.computeTangents()` (requires index + uv + normal). Optional fallback: derivative-based TBN (`dFdx(position)`/`dFdx(uv)` cotangent frame — the same math `TextureBump` in this repo already uses) when the attribute is absent.
- **Tests:** graph compiles with tangent attribute + varyings present; strength=0 yields the geometry normal; identifier-validated injection names.
- **Downstream payoff:** Earth can re-add `8k_earth_normal_map.jpg` (was `normalScale 0.75` pre-conversion).

### Fix #5 — ambient / world lighting

- **Where:** `st-shader-core/src/nodes/shader/PrincipledBSDF.ts` (+ optionally a new input node).
- **What (minimum, fixes the night-side bug):** add an `ambient` color input (default `[0,0,0]`, so existing scenes are pixel-identical — non-breaking). In the lighting math, add `ambientColor * baseColor` to the direct-light result *outside* the N·L term, so it illuminates fragments facing away from the sun. Apply the same to `DiffuseBSDF`/`GlossyBSDF` if they share the lighting helper.
- **What (better, Blender-faithful):** a `WorldEnvironment` input node (Blender: World → Background shader) exposing `Color`/`Strength` outputs as auto-registered uniforms, so one node instance can drive many materials and be animated at runtime. The consumer orchestrator would set it from the scene's ambient light values.
- **Explicit non-goal for now:** full IBL (`scene.environment` cubemap sampling) — `EnvironmentTexture` already exists for explicit cubemap graphs; integrating three.js scene lighting automatically is a bigger architectural decision. The constant ambient term alone resolves the pitch-black-night class of bug.
- **Tests:** default ambient produces byte-identical fragment source to current output; non-zero ambient appears additively outside the N·L factor.
- **Downstream cleanup (this repo):** planet surface builders (`{Planet}Surface.ts`) pass ambient ≈ 0.03–0.05 × the EnvironmentManager ambient colour; the hand-tuned `nightTint` emissions can then be reduced or kept as artistic flavour. Retune per planet at a visual pass — current values were tuned against MeshStandardMaterial + scene ambient.

### Release checklist (applies to all of the above)

1. Fix in `st-shader-core/src`, tests in `st-shader-core/test/run-tests.js`, all existing tests still pass.
2. Version bump (0.2.0 — these are features, not patches), update monorepo BACKLOG.md/HANDOVER.md.
3. `npm publish` (0.1.2 precedent: repo-only fixes helped nobody until published — see finding #6's history).
4. In this repo: `npm update`, clear `node_modules/.vite`, migrate call sites off the local workaround nodes (`RgbaOutput`, `UvPan`, possibly `TextureBump`), visual pass on sol + landing + warp, update this file marking findings resolved.

---

*Recorded 2026-07-06.*
