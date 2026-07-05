# Package Issues — Exo Space Planetarium

Real-world test log for `@triforge/*` and `strata-css` packages.  
Each entry records what broke, why, what was done about it, and what the package author needs to fix.

---

## Severity Levels

| Level | Meaning |
|---|---|
| **CRITICAL** | Breaks the site or causes data loss |
| **HIGH** | Major feature broken or incorrect output |
| **MEDIUM** | Feature works but behaves unexpectedly |
| **LOW** | Minor visual or non-blocking issue |
| **INFO** | Observation worth noting, not a bug |

---

## Environment Issues (pre-existing, not package-related)

### esbuild `0.27.3–0.28.0` — Arbitrary file read on Windows dev server
- **Date:** 2026-06-20
- **Severity:** LOW
- **Advisory:** https://github.com/advisories/GHSA-g7r4-m6w7-qqqr
- **Context:** Only exploitable if the dev server is exposed on a network. Local dev only — risk accepted.
- **Resolution:** No fix available without downgrading Astro to 5.17.2, which reintroduces 6 high-severity Astro vulnerabilities. Astro 6.4.8 is the safest achievable configuration.
- **Status:** `ACCEPTED` — monitor for upstream resolution.

---

## strata-css

### PostCSS plugin missing `from` option
- **Date:** 2026-06-20
- **Severity:** LOW
- **Error:** `A PostCSS plugin did not pass the 'from' option to postcss.parse. This may cause imported assets to be incorrectly transformed.`
- **Context:** Appears during Vite/Astro build when the strata-css PostCSS plugin processes `src/styles/strata.css`. Build completes successfully and CSS output is correct — no broken output observed.
- **Fix applied in package (1.2.8):** All `postcss.parse()` calls now receive `{ from }` sourced from `result.opts.from`. Warning no longer fires.
- **Status:** `FIXED in 1.2.8`

---

## @triforge/compositor-core

### `import("postprocessing")` eagerly resolved by Vite pre-bundler
- **Date:** 2026-06-20
- **Severity:** MEDIUM
- **Error:** `Failed to resolve import 'postprocessing' from node_modules/.vite/deps/@triforge_compositor-core.js`
- **Context:** Vite's dependency optimizer scanned the dynamic `import('postprocessing')` call inside `_compilePmndrs()` and tried to pre-bundle it even though it only runs when `backend === 'pmndrs'`. We use the default `'three'` backend, so the import is never executed at runtime — but Vite still resolves it at build time and fails.
- **Workaround applied (0.1.0):** Created `src/stubs/postprocessing.js` (empty module stub) + `resolve.alias` mapping `postprocessing` → stub.
- **Fix applied in package (0.1.1):** Changed to `Function('m', 'return import(m)')('postprocessing')` — an indirect call opaque to all static analyzers. Vite and all other bundlers leave it alone.
- **Stub deleted from project.** `resolve.alias` for postprocessing removed.
- **Status:** `FIXED in 0.1.1`

---

### Bloom pass — `UnrealBloomPass` not resolved via `three/addons` in Vite
- **Date:** 2026-06-20
- **Severity:** MEDIUM
- **Error:** `Bloom: UnrealBloomPass not found in three/addons.`
- **Context:** `CompositorOutput._loadThreePassModules()` used dynamic `import('three/addons/postprocessing/UnrealBloomPass.js')`. Vite could not resolve bare `three/addons/*` specifiers from inside a pre-bundled module. The import silently failed (caught internally), leaving the registry entry undefined, which `_buildThree()` then threw on.
- **Workaround applied (0.1.0):** Bloom removed from EnvironmentManager.
- **Fix applied in package (0.1.1):** Converted to static import: `import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'`. Vite resolves static `three/examples/jsm/*` paths correctly.
- **Status:** `FIXED in 0.1.1`

---

### Systematic incompatibility — all `three/addons/*` dynamic imports fail in Vite
- **Date:** 2026-06-20
- **Severity:** HIGH
- **Context:** All postprocessing passes (Bloom, Vignette, FilmGrain) used `import('three/addons/postprocessing/*.js')` with a runtime template literal. No bundler can statically resolve variable import paths.
- **Workaround applied (0.1.0):** `@triforge/compositor-core` removed from project entirely. Plain `renderer.render(scene, camera)` used instead.
- **Fix applied in package (0.1.1):** All three pass constructors converted to static imports from `three/examples/jsm/postprocessing/`. Compositor restored to EnvironmentManager.
- **Root cause analysis** (for reference):

  | Bundler | Result in 0.1.0 |
  |---|---|
  | **Vite** | Silent fail — `three/addons/*` not intercepted inside pre-bundled output |
  | **Webpack** | Either bloats bundle with all 30+ passes or throws "not statically analyzable" |
  | **Rollup** | Leaves import unresolved in output |
  | **esbuild** | Same as Rollup |
  | **Parcel** | Same static analysis limitation |

  The only environment where 0.1.0 worked: browser + `<script type="importmap">` (no bundler). This pattern is not used in any modern production framework.

- **Status:** `FIXED in 0.1.1`

---

## @triforge/* — Multiple Three.js instances warning

### All packages — missing `exports` field causes Vite deduplication failure
- **Date:** 2026-06-20
- **Severity:** MEDIUM
- **Warning:** `THREE.WARNING: Multiple instances of Three.js being imported.`
- **Root cause:** All `@triforge/*` packages had only a `main` field in `package.json` and no `exports` field. Vite treated them as legacy CJS modules and pre-bundled them differently — the `three` import inside each package did not get deduplicated against the project's own `three` instance, resulting in two separate Three.js module instances. Three.js detects this and fires the warning. Having two instances causes `instanceof` checks to silently fail.
- **Workaround applied (0.1.0):** Added `resolve.dedupe: ['three']` to `astro.config.mjs`.
- **Fix applied in package (0.1.1):** All 5 packages now ship a proper `exports` field:
  ```json
  { ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" } }
  ```
  Vite correctly deduplicates `three` without needing `resolve.dedupe`. The workaround remains in `astro.config.mjs` as a belt-and-suspenders safety measure.
- **Status:** `FIXED in 0.1.1`

---

## @triforge/geometry-nodes

### `DistributePointsOnFaces` — output socket named `"Points"` not `"Geometry"`
- **Date:** 2026-06-20
- **Severity:** HIGH
- **Error:** `Node "DistributePointsOnFaces" has no output socket "Geometry". Available: Points`
- **Context:** Calling `scatter.output('Geometry')` on a `DistributePointsOnFaces` node throws at runtime because the actual output socket is named `'Points'`, not `'Geometry'`. Socket names are not listed anywhere in the type definitions — the only way to discover them is from the runtime error message.
- **Fix applied in project:** Changed `scatter.output('Geometry')` → `scatter.output('Points')` in `src/scripts/objects/AsteroidBelt.ts`.
- **Fix needed in package:** Export socket name constants (e.g. `DistributePointsOnFaces.OUT_POINTS = 'Points'`) or add them to the `.d.ts` so IDEs can surface them without a runtime crash.
- **Status:** `FIXED in project code` / `OPEN for package to type socket names`

---

## Project Bugs Found and Fixed

### `AsteroidBelt.ts` — `Float32Array` allocated `count * 1` instead of `count * 3`
- **Date:** 2026-06-20
- **Severity:** HIGH (project bug, not a package bug)
- **File:** `src/scripts/objects/AsteroidBelt.ts` (original), line 27
- **Code:** `new Float32Array(count * 1)`
- **Impact:** Buffer was 3× too small. Writing to `positions[i*3]`, `positions[i*3+1]`, `positions[i*3+2]` caused out-of-bounds writes — undefined behaviour, likely silent data corruption or crash at runtime.
- **Fix:** Migrated `buildRing()` to `@triforge/geometry-nodes` (`GeometryLiteral` + `DistributePointsOnFaces` + `SetPosition`). The geometry-nodes graph generates correct `BufferGeometry` internally — no manual `Float32Array` allocation needed.
- **Status:** `FIXED`

### Saturn, Uranus, Neptune — `RadiusParametricGeometry` used for spherical planet bodies
- **Date:** 2026-06-20
- **Severity:** HIGH (project bug)
- **Files:** `Saturn.ts`, `Uranus.ts`, `Neptune.ts`
- **Symptom:** UV texture seam artifact visible as a vertical cut on the planet surface; incorrect surface normals made Saturn appear very dark. All other planets rendered correctly.
- **Root cause:** `RadiusParametricGeometry` does not duplicate seam vertices at `u=0`/`u=1`, so the UV texture tears along the seam. `THREE.SphereGeometry` handles seam duplication correctly. Mercury, Venus, Earth, Mars, Jupiter, and Sun all used `THREE.SphereGeometry` and were unaffected.
- **Fix:** Replaced all `RadiusParametricGeometry` calls (main, cloud, atmosphere meshes) in the three files with `THREE.SphereGeometry(radius, 64, 64)`. Oblate `geometry.scale()` calls preserved.
- **Status:** `FIXED`

