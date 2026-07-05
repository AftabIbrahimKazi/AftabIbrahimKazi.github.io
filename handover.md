# Handover — Exo Space Planetarium

**Date:** 2026-06-21
**Last updated:** 2026-07-06 — Phases 16–17: animations/ + environment/ split by domain, warp + carousel GLSL ported to triforge (visual pass ✅), CoreShaderNodes promoted to top level, SolOrchestrator extracted, SolEngine rename, `{domain}-entry.ts` convention
**Purpose:** State-of-the-project summary for continuity between sessions.

---

## What This Project Currently Is

A **portfolio/showcase website** built on **Astro 6 MPA** with a **Three.js solar system** as the core navigation metaphor. The landing page features a fullscreen nebula canvas + identity section + planet carousel. Clicking a planet triggers a **warp-speed transition** (custom GLSL shader) and navigates to that planet's dedicated page. Each planet page is a separate Astro route with a 3D scene and content overlay. The mythology framing is Hindu Navagraha — each planet represents a category of work.

---

## Tech Stack — Exact Installed Versions

| Package | Version | Role |
|---|---|---|
| astro | 6.4.8 | Framework / MPA SSG |
| three | 0.183.1 | 3D renderer |
| gsap | 3.14.2 | Camera tweening (CameraController) |
| strata-css | 1.4.5 | CSS utility framework — `gap-[...]` arbitrary (incl. responsive) resolved this version |
| @strata-packages/offcanvas | 1.0.1 | Offcanvas sidebar (drawer) — open/close via `StrataOffcanvas.open(el)` / `.close()` |
| @strata-packages/modal | 1.0.2 | Centred dialog modal — installed, not yet used |
| @triforge/keyframe | 0.1.1 | Planet rotation + texture pan animations |
| @triforge/geometry-nodes | 0.1.1 | Asteroid belt point scatter |
| @triforge/shader-core | 0.1.1 | Installed, NOT yet integrated |
| @triforge/compositor-core | 0.1.1 | Installed, NOT yet integrated |
| @triforge/animation-core | 0.1.0 | Installed, NOT yet integrated |
| @triforge/curve-core | 0.1.0 | Installed, NOT yet integrated |
| @triforge/particle-core | 0.1.0 | Installed, NOT yet integrated |
| @triforge/modifier-core | 0.1.0 | Installed, NOT yet integrated |
| @triforge/uv-core | 0.1.0 | Installed, NOT yet integrated |
| @triforge/volume-core | 0.1.0 | Installed, NOT yet integrated |
| @triforge/core-types | 0.1.0 | Peer dep, internal |
| @fortawesome/fontawesome-free | 7.2.0 | Icons (self-hosted) |
| astro-icon + @iconify-json/lucide | 1.1.5 | Lucide icons via Astro |

---

## Source File Map

```
src/
├── layouts/
│   ├── Landing.astro           — Landing page layout (nebula canvas + warp + header/footer)
│   └── Main.astro              — Planet page layout (3D scene + warp overlay)
├── pages/
│   ├── index.astro             — Landing page (Beat 01–06, incl. journal section)
│   ├── sol.astro               — Sun page
│   ├── venus.astro … neptune.astro    — 7 planet pages (mercury.astro removed — /mercury now resolves via /sol?target=mercury)
├── components/
│   ├── WarpOverlay.astro       — Reusable warp canvas + veil (used by both layouts)
│   ├── LandingHeader.astro     — Fixed header: logo, nav, section badge, dot-nav
│   ├── LandingFooter.astro     — Fixed footer: copyright + links
│   ├── Scene.astro             — Three.js canvas mount point (planet pages)
│   └── overlays/
│       ├── ContentOverlay.astro
│       ├── SunOverlay.astro
│       ├── MercuryOverlay.astro … NeptuneOverlay.astro
├── scripts/
│   ├── landing-entry.ts        — Landing entry: boots LandingOrchestrator (bootstrap only)
│   ├── warp-entry.ts           — WarpRouter entry (all pages)
│   ├── sol-entry.ts            — Sol/planet page entry: boots SolOrchestrator (bootstrap only)
│   ├── core/
│   │   ├── solar-system/
│   │   │   ├── SolEngine.ts
│   │   │   └── SolOrchestrator.ts      — Sol linchpin: wires engine, env, objects, controllers, loop
│   │   └── landing/
│   │       ├── LandingEngine.ts        — Scene + camera + renderer for nebula canvas
│   │       └── LandingOrchestrator.ts  — Landing linchpin: wires engine, objects, camera, loop
│   ├── shader-nodes/
│   │   └── CoreShaderNodes.ts  — shared custom triforge nodes + sub-graph builders (all domains; defines no scene objects)
│   ├── objects/
│   │   ├── solar-system/       — sun/ mercury/ … neptune/ (folder per planet), BasePlanet.ts, AsteroidBelt.ts
│   │   └── landing/            — LandingAsteroids.ts (procedural, no texture assets)
│   ├── environment/
│   │   ├── solar-system/EnvironmentManager.ts   — milky-way backdrop + faint ambient (init() pattern)
│   │   └── landing/     — LandingEnvironment.ts (nebula backdrop + ambient/sun lights), NebulaScene.ts
│   ├── animations/
│   │   ├── solar-system/   — RenderLoop.ts, AnimationManager.ts, SunAnimation.ts … NeptuneAnimation.ts
│   │   └── landing/        — LandingRenderLoop.ts (single rAF loop), LandingAsteroidsAnimation.ts (tumble math)
│   ├── controllers/
│   │   ├── solar-system/       — CameraController, InteractionController, ControllerManager
│   │   └── landing/LandingScrollCamera.ts
│   ├── ui/
│   │   ├── solar-system/       — ExploreOverlayController, JournalSidebarController, PlanetScrollCameras
│   │   └── landing/            — LandingCarousel, LandingDotNav, LandingHeaderHide, LandingJournal,
│   │                             CommCarousel, RepoCarousel, CarouselPlanets (8 mini WebGL renderers)
│   └── warp/                   — WarpRouter.ts + WarpTransition.ts + WarpShaderNodes.ts (site-wide navigation effect subsystem)
└── styles/
    └── strata.css

public/css/
├── variables.css               — ALL design tokens (single source of truth)
├── main.css                    — Global styles (header, footer, canvas, tooltips)
├── landing.css                 — Landing page styles (excluding footer)
├── landing-footer.css          — LandingFooter component styles (separated from landing.css)
├── journal.css                 — Mercury journal page styles (article grid + newsletter CTA)
├── explore-overlay.css         — Shared overlay container + entry header
├── sun-overlay.css             — Sun overlay
├── mercury-overlay.css         — Mercury overlay (also holds [data-planet-content] visibility rules)
├── venus-overlay.css           — Venus overlay
├── earth-overlay.css           — Earth overlay
├── mars-overlay.css            — Mars overlay
├── jupiter-overlay.css         — Jupiter overlay
├── saturn-overlay.css          — Saturn overlay
├── uranus-overlay.css          — Uranus overlay
└── neptune-overlay.css         — Neptune overlay
```

---

## CSS Coding Standards (Enforced)

These rules apply to **all CSS in the project**. Read before writing any CSS.

### Variables (`variables.css`)
- **Single source of truth.** Every reusable value lives here. No variables in page or component CSS files.
- **Variables store values only**, never full declarations. Wrong: `--ex-transition-color: color 1.2s ease`. Right: `--ex-duration-slow: 1.2s`.
- **Gradient variables store colour stop values only.** `linear-gradient()` is written in the CSS rule, not stored in a variable.
- **Font weights are numeric only.** `400`, `600`, `700`, `800` — never `bold`, `normal`, `semi-bold`.
- **All scales follow the `xxxs → xxs → xs → sm → default → md → lg → xl → xxl → xxxl` naming convention.** Every scale has a `default` alias at the body/base step.
- **No `line-height` variables.** Line height is a body-only concern (see below).

### Token Scales in `variables.css`

| Scale | Variables | Values |
|---|---|---|
| Font size | `xxxs` `xxs` `xs` `sm` `default` `md` `lg` `xl` `xxl` `xxxl` | 10 11 12 14 14 22 24 32 48 64 px |
| Font weight | `--ex-para-font-weight` `--ex-font-weight-medium` `--ex-font-weight-semibold` `--ex-heading-font-weight` `--ex-font-weight-heavy` | 400 500 600 700 800 |
| Spacing | `xxxs` `xxs` `xs` `sm` `default` `md` `lg` `xl` `xxl` `xxxl` | 2 4 8 12 16 24 32 48 64 80 px |
| Letter spacing | `--ex-tracking-tight` `sm` `md` `lg` `xl` | -0.02 0.06 0.12 0.18 0.22 em |
| Opacity | `--ex-opacity-faint` `low` `body` `mid` `high` | 0.50 0.55 0.65 0.70 0.80 |
| Transition duration | `--ex-duration-fast` `mid` `slow` | 0.3 0.9 1.2 s |
| Planet colours | `--ex-color-{planet}-hi/lo/border/border-inner/label/bg/pill-bg` | per planet |
| Planet glow | `--ex-color-{planet}-glow` | hover box-shadow stops, all 9 planets |
| Planet tooltip bg | `--ex-color-{planet}-tip-fade` / `-tip-fill` | tooltip/button bg gradient stops, all 9 planets |
| Planet text gradient | `--ex-color-{planet}-text-hi` / `-text-lo` | button label text gradient (Sun, Mercury, Venus, Earth only; others reuse `-hi`/`-lo`) |
| Tooltip wrapper | `--ex-color-tooltip-fade` / `-tooltip-opaque` | shared tooltip wrapper gradient stops |

### Line Height
- **Defined only on `.ex-body` in `main.css`.** No `line-height` property anywhere else in any CSS file. No line-height variables.

### In component CSS files
- **Spacing (padding, margin, gap):** always `var(--ex-space-*)`.
- **Font sizes:** always `var(--ex-font-size-*)`.
- **Font weights:** always `var(--ex-*-font-weight)`.
- **Letter spacing:** always `var(--ex-tracking-*)`.
- **Opacity:** always `var(--ex-opacity-*)`.
- **Colors:** always `var(--ex-color-*)` or theme tokens (`--ex-text-body`, `--ex-bg-body`, etc.).
- **Transitions:** `transition: color var(--ex-duration-slow) ease` — property name in CSS, duration from variable.
- **Gradients:** `linear-gradient()` written in CSS, using colour-stop variables for the stops.
- **Acceptable hardcoded values:** `0` (zero), structural one-off layout numbers unique to a single component (e.g. `420px` max-width, `100dvh`, `2px` border), `blur()` values, `calc()` viewport expressions.

---

## Warp Transition System

### WarpTransition.ts
- Fullscreen WebGL canvas (`#ex-warp-canvas`) with a custom GLSL fragment shader
- Simulates 3D perspective star field with speed, glow, and chromatic fringe
- **Uniforms:** `u_time`, `u_speed`, `u_opacity`, `u_fade`, `u_color` (RGB vec3)
- **`u_fade`:** animates 1→0 during the final segment of reverse warp — dissolves stars in-shader before canvas clears
- **`u_color`:** drives glow colour + star trail tint, set per destination page
- Uses `THREE.Timer` (not deprecated `THREE.Clock`) — must call `clock.update()` before reading `elapsedTime`

### WarpRouter.ts
- Static class that intercepts every `<a href>` click site-wide
- **On exit:** sets colour to destination page, fades veil in over 0.35s, plays forward warp, then navigates
- **On entry:** sets colour to current page, plays reverse warp, fades veil out after 220ms
- `PAGE_COLORS` map: maps each page URL (`'/'`, `'/sol'`, `'/mercury'` … `'/neptune'`) to an RGB tuple used for `u_color`
- Planet carousel uses a synthetic `<a>` click trick to route through WarpRouter without changing markup

### WarpOverlay.astro
- Reusable component: `#ex-warp-canvas` + `#ex-warp-veil` with `<style is:global>`
- Included in both `Landing.astro` and `Main.astro`

---

## Landing Page Structure (`src/pages/index.astro`)

Four full-height sections, scroll-snapped via `.lp-main`:

| Beat | ID | Content |
|---|---|---|
| 01 | `#lp-beat-01` | Two-column: identity left (hero heading, gold divider, body), stats right (4-col grid with SVG outline icons) |
| 02 | `#lp-beat-02` | Planet carousel — click once to activate, click again to warp |
| 03 | `#lp-beat-03` | The Work — project pills, right-aligned |
| 04 | `#lp-beat-04` | CTA — "START THE JOURNEY" → `<a href="/sol">` |

Header (`LandingHeader.astro`): fixed, AK logo + nav + section badge + dot-nav (updates on scroll).
Footer (`LandingFooter.astro`): fixed bottom bar, copyright + GitHub/Contact links.

---

## Astro Script Pattern

All TS/npm scripts must use inline `<script>import '...'</script>` (no `src=` attribute) so Vite processes them:

```astro
<script>
  import '../scripts/landing';
</script>
```

---

## Vite / Astro Config (astro.config.mjs)

```js
export default defineConfig({
  integrations: [icon()],
  devToolbar: { enabled: false },
  vite: {
    css: { postcss: { plugins: [strataCSS()] } },
    resolve: { dedupe: ['three'] },
    optimizeDeps: {
      include: ['three', 'gsap', '@triforge/keyframe', '@triforge/geometry-nodes', '@triforge/radius-parametric-geometry'],
    },
  },
});
```

---

## Completed Work

### Phase 1 — Naming convention rename ✅
All IDs, classes, data-attributes: `ct-` → `ex-` prefix.

### Phase 2 — CSS framework swap ✅
Bootstrap CDN → `strata-css`. Font Awesome CDN → self-hosted npm.

### Phase 3 — Dev environment stabilisation ✅
504 errors fixed, `THREE.Clock` → `THREE.Timer`, multiple Three.js instances resolved.

### Phase 4 — Triforge package migration (partial) 🔄
| Sub-task | Status |
|---|---|
| Animations: GSAP → `@triforge/keyframe` | ✅ All 9 planets + sun |
| Asteroid belt → `@triforge/geometry-nodes` | ✅ |
| Planet spheres → `@triforge/radius-parametric-geometry` | ⚠️ Reverted — UV seam tear on Saturn/Uranus/Neptune. All planets stay on `THREE.SphereGeometry`. |
| Planet materials → `@triforge/shader-core` | ❌ Not started |
| Post-processing → `@triforge/compositor-core` | ❌ Not started |

### Phase 5 — Portfolio pivot + landing page ✅
- Project repurposed from pure 3D demo to portfolio showcase
- Astro MPA with separate routes per planet
- `WarpTransition.ts` + `WarpRouter.ts` — fullscreen GLSL warp between pages
- `WarpOverlay.astro` — reusable warp canvas component
- `LandingHeader.astro` + `LandingFooter.astro` — fixed chrome
- Landing page Beat 01–04 with planet carousel
- Dynamic warp colour per destination (`PAGE_COLORS` map)

### Phase 6 — CSS standards enforcement ✅
- `variables.css` fully restructured: scale-based tokens for font size, font weight, spacing, letter spacing, opacity, transition duration, colour palette, gradient stops
- `main.css` updated: full-property transition vars → `property var(--ex-duration-*) ease`, gradient vars → `linear-gradient()` with colour-stop vars
- `landing.css` fully compliant

### Phase 8 — Standards compliance audit + enforcement ✅

Full project audit against all loaded coding standards. 17 violations identified and fixed.

| # | Task | Files changed |
|---|---|---|
| 6 | State attribute rename: all non-`data-*` attribute selectors → `data-*` equivalents in HTML, CSS, and TS | `main.css`, `explore-overlay.css`, `landing.css`, `Main.astro`, `LandingHeader.astro`, `ExploreOverlayController.ts`, `CameraController.ts`, `InteractionController.ts` |
| 7 | `removeAttribute` calls → set to empty string (`dataset.x = ''`) | `ExploreOverlayController.ts`, `InteractionController.ts` |
| 8 | Props interfaces added to both layouts | `Main.astro`, `Landing.astro` |
| 9 | SEO meta tags (description, canonical, OG) added to both layouts | `Main.astro`, `Landing.astro` |
| 10 | `<script src=…>` → inline `<script>import '…'</script>` in Main.astro (A-01 compliance) | `Main.astro` |
| 11 | `<br />` → `<span class="ex-line-break"></span>` + `.ex-line-break { display: block }` utility class | `index.astro`, `main.css` |
| 12 | `outline: none` without replacement → `:focus-visible` with `2px solid var(--ex-border-color)` | `main.css` |
| 13 | Carousel inline script block extracted to dedicated TS file | `index.astro` → `LandingCarousel.ts` |
| 14 | Dot-nav inline script block extracted to dedicated TS file | `LandingHeader.astro` → `LandingDotNav.ts` |
| 15 | `classList.toggle('lp-dot--active')` / `classList.toggle('lp-planet-item--active')` → `dataset.active = String(…)` + CSS selectors updated | `LandingCarousel.ts`, `LandingDotNav.ts`, `landing.css` |
| 16 | Planet glow/gradient hardcoded `rgba()` values → `var(--ex-color-{planet}-*)` tokens; new token families added | `main.css`, `variables.css` |
| 17 | CSS property blocks alphabetized (A→Z) across all affected files | `main.css`, `explore-overlay.css`, `landing.css` |

**Architectural issues flagged but deferred** (require developer decisions — no code change made):
- `SolEngine` and `LandingEngine` constructors perform DOM work and call `init()` directly — violates orchestrator pattern (JT-04)
- No `destroy()` method on any engine or controller — memory leak risk on MPA navigation
- `landing.ts` and `main.ts` entry files contain logic beyond bootstrapping — violates E-01

---

### Phase 9 — 3D carousel planets ✅

Replaced all 8 flat `background-image` circle `<div>` elements in `index.astro`'s planet carousel with `<canvas>` elements. Each canvas gets its own `WebGLRenderer`.

**`src/scripts/landing/CarouselPlanets.ts`** (new file):
- 8 independent `WebGLRenderer` instances, one per canvas (90×90 hardcoded — `clientWidth` returns 0 for off-screen scroll-snapped elements)
- `renderer.setClearColor(0x000000, 0)` — transparent background
- `ACESFilmicToneMapping` at `toneMappingExposure: 2.0` — matches planet page aesthetic
- Per-planet `MeshStandardMaterial` sphere with correct radius (sourced from each planet's `SphereGeometry` call in its class file) and axial tilt (`rotation.z` degrees → radians)
- `AmbientLight` + `DirectionalLight` per scene — simple and reliable (planet class `onBeforeCompile` shaders were not usable in isolated mini-scenes without envmap/fog/shadows; the `vWorldPos` varying injection fails silently, outputting black)
- Fresnel `ShaderMaterial` atmosphere sphere per planet, per-planet glow colour (`uColor`) matching each planet class's `glowColor` value
- Cloud sphere for Earth, Venus, and Mars — replicates the texture + material from each planet class without the terminator `onBeforeCompile` (directional light handles the day/night boundary)
- Saturn ring removed entirely from carousel (ring back half was visually incorrect; planet-only display is cleaner)
- Render loop: `mesh.rotation.y = t * 0.2`, cloud layers at `t * 0.22`

**`src/pages/index.astro`** — all 8 planet orb `<div>` → `<canvas class="lp-planet-orb" data-texture="..." data-planet="...">`. `.lp-saturn-ring` div removed.

**`public/css/landing.css`** — `background-position`/`background-size` removed from `.lp-planet-orb`; `display: block` added (canvas is inline by default); `.lp-saturn-ring` block removed entirely.

**`src/scripts/landing.ts`** — `CarouselPlanets` imported and booted inside `DOMContentLoaded`.

---

### Phase 10 — Mercury journal page ✅

`/mercury` repurposed from a 3D planet scene page to a journal/blog listing page. The existing `MercuryOverlay.astro` still serves the planet science content inside the main 3D scene on the Sol page — this is a separate route.

**`src/pages/mercury.astro`** (new file):
- Self-contained HTML page — no `Main.astro` layout import (avoids booting the heavy `SolEngine` + Three.js scene)
- Imports: `WarpOverlay`, `LandingHeader`, `LandingFooter` — reuses site chrome and warp transitions
- Script: only `warp-router-init` — no 3D scene or planet engine
- 4 hardcoded `articles` entries (placeholder images at `/images/articles/article-0N.jpg` — **images not yet added**)
- 4-column article card grid + "Stay in Orbit" newsletter CTA section
- Newsletter background: existing `8k_earth_daymap.jpg` texture (stand-in until a real image is sourced)
- SEO meta tags, OG tags, canonical URL

**`public/css/journal.css`** (new file):
- Full journal page style system: `.ex-jn-body`, `.ex-jn-main`, `.ex-jn-container`, `.ex-jn-section-header`, `.ex-jn-grid`, `.ex-jn-card` (+ image, read-time, body, category variants, title, excerpt, footer, date, arrow), `.ex-jn-newsletter` (+ bg, content, eyebrow, title, desc, form, input, btn)
- All values token-compliant — no hardcoded colours, font sizes, spacing, or weights

**`public/css/variables.css`** — 4 article category colour tokens added:
```css
--ex-color-cat-development: #8b5cf6;
--ex-color-cat-design:      #f59e0b;
--ex-color-cat-technology:  #3b82f6;
--ex-color-cat-life:        #10b981;
```

---

### Phase 7 — Full CSS variable audit ✅
Complete audit and variablisation of all CSS across the entire project:
- **Colors / backgrounds / borders:** all `rgba()` values in planet overlay files replaced with per-planet colour tokens (`--ex-color-{planet}-hi/lo/border/border-inner/label/bg/pill-bg`) defined in `variables.css`
- **Padding:** all hardcoded `px` values replaced with `var(--ex-space-*)`
- **Margin:** all hardcoded `px` values replaced with `var(--ex-space-*)` across `main.css`, `explore-overlay.css`, and all 9 planet overlay files
- **Font size / font weight / letter spacing:** all hardcoded values replaced with scale variables
- **Spacing scale renamed:** `xxxs→xxxl` + `default` convention, even-number values ascending from 2px, 10 steps total
- **Font size scale renamed:** same `xxxs→xxxl` + `default` convention, 10 steps
- **Letter spacing consolidated:** 8 variables → 5, ascending order (`tight sm md lg xl`). Removed `xs`, `base`, `2xl` (merged into nearest neighbour).
- **Line height removed entirely:** all `line-height` properties stripped from every file. No line-height variables. Line height is set only on `.ex-body` in `main.css`.
- All 9 planet overlay files (`sun`, `mercury`, `venus`, `earth`, `mars`, `jupiter`, `saturn`, `uranus`, `neptune`) fully compliant.

---

### Phase 11 — Strata utility migration + footer component separation ✅

**Strata utility class adoption** — all landing page HTML and CSS audited for properties expressible as strata utility or arbitrary classes. Custom CSS removed where strata covers it.

**Rules applied:**
- `d-flex`, `flex-column`, `align-items-*`, `justify-content-*`, `position-*`, `overflow-*`, `text-*`, `object-fit-*`, `flex-shrink-0`, `w-100`, `h-100` → named strata utilities
- Padding and margin → `pt-[...]`, `pb-[...]`, `px-[...]`, `py-[...]`, `pe-[...]`, `ps-[...]`, `mt-[...]`, `m-0` arbitrary/named classes (directional split required due to finding #6 — shorthand underscores not replaced)
- Text color → `text-[var(--ex-color-*)]` arbitrary on direct elements (stays in CSS for descendant selectors)
- Solid background color → `bg-[var(--ex-color-*)]` arbitrary
- Height/width → `h-[var(...)]`, `w-[var(...)]` arbitrary
- `font-size`, `font-weight`, `font-style` → stay in CSS (no arbitrary support; `text-[var(...)]` broken for font-size — see findings)
- `gap` → stays in CSS (no arbitrary support — see findings)
- Gradient backgrounds → stay in CSS (see finding #5)
- Hover states → stay in CSS (cannot express with static utility classes)
- Descendant selector colors (nav links, social links) → stay in CSS

**Footer CSS separation:**
- `public/css/landing-footer.css` created — owns all `.lp-footer-*` styles
- Footer block removed from `public/css/landing.css`
- `<link rel="stylesheet" href="/css/landing-footer.css" />` added to `src/layouts/Landing.astro`

**`strata-findings.md` created** (project root) — 14 documented entries:
- `[BUG]`: `rounded-pill` layer mismatch; `text-[var(...)]` font-size detection fails; `bg-[...]` generates `background-color` not `background`; spacing arbitrary no underscore replacement
- `[LIMITATION]`: no `gap` arbitrary; no `font-weight` arbitrary; no `font-style` utility; no `inset`/offset utilities; no `object-position`; no `grid-template-columns`
- `[BEHAVIOUR]`: `z-*` does not set position; `card` sets `position: relative`; `list-group-item` sets `display: block`

**`src/pages/index.astro`** — `.lp-jn-card-body` instances restored with `d-flex flex-column` (strata `card-body` does not provide `display: flex`).

**`src/components/LandingFooter.astro`** — footer bar restructured with `row / col-auto / col / col-auto` grid. All convertible padding, margin, color, and bg-color declarations moved to utility/arbitrary classes.

**Container / row / col rule confirmed and enforced:** `.container`, `.row`, `.col-*` divs are pure structural wrappers — no CSS rules target them. Semantic classes live on sibling or child wrapper divs.

---

### Phase 13 — Planet sidebar system (all 7 remaining planets) ✅

Offcanvas sidebar system extended from Mercury to all remaining planets: Sun, Venus, Earth, Mars, Jupiter, Saturn, Uranus.

**CSS — `public/css/overlay/{planet}-overlay.css`** (all 7 files appended):
- `.ex-{planet}-sidebar` — custom property overrides: `--st-offcanvas-width: min(520px, 100vw)`, `--st-bg`, `--st-border`, `--st-duration`, `--st-easing`
- `background-color` declared directly on the class (bypasses `var(--st-bg)` cascade issue)
- `border-top: 2px solid var(--ex-color-{planet}-hi)` — planet identity accent stripe
- Directional borders: `[data-st-side="left"] { border-right }` / `[data-st-side="right"] { border-left }`
- `backdrop-filter: blur(20px)` on all sidebar classes
- Inner structure classes: `sidebar-inner`, `sidebar-header`, `sidebar-close`, `sidebar-cat`, `sidebar-title`, `sidebar-meta`, `sidebar-body`, `detail-link`
- `detail-link` uses per-planet gradient text (`linear-gradient` with `background-clip: text`)
- Background colours (0.94 opacity): sun `rgba(70,28,0)`, venus `rgba(60,28,0)`, earth `rgba(0,18,55)`, mars `rgba(65,12,0)`, jupiter `rgba(50,30,5)`, saturn `rgba(45,38,5)`, uranus `rgba(0,32,42)`

**HTML — `src/components/overlays/ContentOverlay.astro`** (all 7 planets added):
- Each planet gets two sidebar elements: `#ex-{planet}-sidebar-left` and `#ex-{planet}-sidebar-right`
- Both carry class `ex-{planet}-sidebar offcanvas` and `data-st-side="left|right"`
- Content IDs: `ex-{planet}-sidebar-cat-{side}`, `ex-{planet}-sidebar-title-{side}`, `ex-{planet}-sidebar-meta-{side}`, `ex-{planet}-sidebar-body-{side}`

**Astro overlays — `src/components/overlays/{Planet}Overlay.astro`** (all 7 rewritten):
- `const items = [...]` data array in frontmatter (category, title, meta, body[])
- `<script type="application/json" id="ex-{planet}-items-data" is:inline set:html={JSON.stringify(items)}>` — data island pattern
- Trigger `<button>` elements on sections with `data-item-id`, `data-item-side`, and **`data-planet="{planet}"`** attributes
- `data-item-side` rule: right/bottom-right/top-right layouts → `left`; left/bottom-left/top-left layouts → `right`

**Side selection logic (all 7 overlay scripts):**
```ts
import StrataOffcanvas from '@strata-packages/offcanvas';
function init(): void {
  // get dataEl, sidebarLeft, sidebarRight, closeBtnLeft, closeBtnRight
  document.addEventListener('click', (e: MouseEvent) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-item-id]');
    if (!btn || btn.dataset.planet !== '{planet}') return;  // ← explicit planet filter
    // populate cat/title/meta/body, call StrataOffcanvas.open(sidebar)
  });
}
init();
```

**Key fix — `data-planet` attribute routing:**
Root cause of the "Saturn wins for all planets" bug: all 7 planet scripts register `document.addEventListener('click', ...)`. Earlier guards used `btn.closest('.ex-{planet}-section')` (DOM traversal) — unreliable with all sections in the DOM simultaneously and Astro's script bundling. Fixed by adding `data-planet="{planet}"` to every trigger button and replacing the DOM traversal guard with `btn.dataset.planet !== '{planet}'` — explicit attribute lookup, no ambiguity.

---

### Phase 12 — Offcanvas sidebar migration ✅

Both project sidebars migrated from custom open/close logic to `@strata-packages/offcanvas`.

**Packages installed / updated:**
- `strata-css` updated 1.4.2 → 1.4.4
- `@strata-packages/offcanvas` 1.0.1 (new)
- `@strata-packages/modal` 1.0.2 (new — centred dialog only, no drawer capability; installed for future use)

**`src/types/strata-packages.d.ts`** (new) — TypeScript module declarations for both packages (no bundled `.d.ts`).

**Mercury journal sidebar (`#ex-jn-sidebar-*`) in `src/pages/mercury.astro`:**
- Single `#ex-jn-sidebar` with dynamic `data-st-side` → two static elements: `#ex-jn-sidebar-left` (`data-st-side="left"`) and `#ex-jn-sidebar-right` (`data-st-side="right"`)
- JS never mutates `data-st-side`; it picks which sidebar to open based on `data-sidebar-position` on the section element
- Backdrop div removed — package manages its own backdrop

**`src/scripts/ui/JournalSidebarController.ts`** (new) — extracted from inline script in `mercury.astro`:
- `JournalSidebarController` class: holds refs to both sidebars; `open(section, content)` routes to left or right based on `section.dataset.sidebarPosition`
- Note: `sidebarPosition === 'left'` opens the RIGHT sidebar (content about a left-positioned article is read from the right), and vice versa
- Imports and calls `StrataOffcanvas.open(el)` / `StrataOffcanvas.close()`

**`public/css/journal.css`:**
- Removed all `data-sidebar-open`, `data-sidebar-side` state CSS and backdrop block
- `.ex-jn-sidebar` token overrides: `--st-offcanvas-width: 360px`, `--st-bg`, `--st-border`, `--st-duration`
- Directional border: `[data-st-side="left"]` → `border-right`, `[data-st-side="right"]` → `border-left`

**Mercury overlay sidebar (`#ex-mercury-sidebar-*`) in `src/components/overlays/ContentOverlay.astro`:**
- Same two-sidebar pattern: `#ex-mercury-sidebar-left` and `#ex-mercury-sidebar-right`
- Content IDs suffixed: `ex-mercury-sidebar-cat-left/right`, `ex-mercury-sidebar-title-left/right`, etc.

**`src/components/overlays/MercuryOverlay.astro`:**
- `data-article-side` added to each article's "Read article" button: article 0 → `left`, article 1 → `right`, article 2 → `left`, article 3 → `right`
- Script rewritten as ES module (no `is:inline`): imports `StrataOffcanvas`, reads `btn.dataset.articleSide` to pick `sidebarLeft` or `sidebarRight`, populates the matching set of content elements by suffix

**`public/css/overlay/mercury-overlay.css`:**
- `--st-z-offcanvas` override removed (was causing sidebar to render behind its own backdrop — package backdrop appends to `<body>` and does not inherit the custom property)
- Package default z-index applies: sidebar 1045, backdrop 1044
- `border-right` removed from base `.ex-mercury-sidebar` rule; split into `[data-st-side="left"] { border-right }` and `[data-st-side="right"] { border-left }`

**`strata-findings.md`:** entry 18 added — `[LIMITATION — RESOLVED]`: `@strata-packages/modal` lacked offcanvas/drawer; resolved by `@strata-packages/offcanvas`.

**Key constraint:** `data-st-side` is set once in HTML and never mutated by JS. `aria-hidden` is the sole open/close state attribute, toggled by the package only.

---

### Phase 14 — Landing footer rebuild, mercury page removal, journal section cleanup ✅

**strata-css updated 1.4.4 → 1.4.5** — `gap-[...]` arbitrary resolved (previously required custom CSS).

**Mercury standalone page removed:**
- `src/pages/mercury.astro` deleted — served no purpose once journal content moved into the landing page's Beat 06 section
- All `/mercury` href links across the project (`LandingHeader.astro`, `index.astro`) repointed to `/sol?target=mercury` — `WarpRouter.ts`'s `pageColor()` already resolves `?target=` query params against `PAGE_COLORS`, so warp colour continuity required no code changes

**`LandingFooter.astro` rebuilt:**
- Bar layout responsive via `d-flex flex-wrap justify-content-center justify-content-md-start` + `flex-grow-1`/`flex-shrink-0` — no row/col grid, no media queries
- "Missions"/"Resources" nav links replaced with "Terms & Conditions"/"Privacy Policy" (placeholder `href="#"`)
- Social links: GitHub + LinkedIn now real (`AftabIbrahimKazi`, `aftab-kazi-715b88193`); X/Instagram/YouTube remain placeholders
- CTA copy replaced: "Nine worlds in orbit, each with a tale. / Pick your planet and set full sail."
- Brand left-aligns on `md` via `justify-content-md-start`

**Journal section (Beat 06, `index.astro`) cleaned up:**
- 5 SVG placeholder article images added at `public/images/articles/article-0{1-5}.svg` (replaces broken `.jpg` references)
- `card-body` strata component class removed from card bodies (was adding padding immediately overridden by `p-[var(--ex-space-md)]`)
- Mercury orb canvas: `rounded-circle` utility replaces custom `border-radius` CSS rule; sized via `h-[var(--ex-size-md)]`/`w-[var(--ex-size-md)]` (240px) with responsive shrink to `--ex-size-default` (180px) at sm/md and `--ex-size-sm` (140px) at xs
- Orb positioned `top-[-85px] right-[85px]` — bleeds above the section into negative space, confirmed not to overlap article cards below
- **Swiper breakpoints added** (`src/scripts/landing/LandingJournal.ts`): `slidesPerView` 1 (default/xs/sm) → 3 (≥768px) → 4 (≥992px), replacing the previous hardcoded `slidesPerView: 4`

**`strata-findings.md`** — entries 19–22 added:
- #19 `[RESOLVED in 1.4.5]` — responsive arbitrary gap (`gap-sm-[...]`) now works
- #20 `[BUG]` — only `col-12` registers; `col-1`–`col-11`, `col-auto`, and responsive `col-{bp}-*` variants produce no CSS (row/col grid abandoned project-wide in favour of flexbox on semantic wrappers)
- #21 `[BEHAVIOUR]` — strata's module-level `resultCache` can cache a `null` lookup for an arbitrary class token before it appears in scanned content; the class then silently fails to generate CSS on every subsequent build until the dev server is restarted (flushes `require()` cache). Not a bug — negative arbitrary values (`top-[-85px]`) and `bottom-[...]`/`left-[...]` all work correctly once the cache is fresh.
- #22 — folded into #21 (duplicate symptom, same root cause)

**Memory note:** project never uses `<br>` — `<span class="ex-line-break"></span>` is the sole line-break mechanism (already enforced via `ex-line-break` utility added in Phase 8).

---

## Known Remaining Issues / Loose Ends

1. ~~`@triforge/radius-parametric-geometry` import in planet files~~ — ✅ removed during the 2026-07-05 planet conversions.
2. **`compositor-core` not wired up** — Bloom, Vignette, FilmGrain can be added to `EnvironmentManager.ts` now that 0.1.1 is stable.
3. ~~`onBeforeCompile` raw GLSL in planet files~~ — ✅ Sun + all 8 planets are triforge node graphs. ~~CarouselPlanets + WarpTransition raw GLSL~~ — ✅ both ported 2026-07-06 (Phase 16). Remaining GLSL exists only *inside custom node classes* (`shader-nodes/CoreShaderNodes.ts`, `warp/WarpShaderNodes.ts`) — that is node authorship, not conversion debt. Upstreaming those nodes into the triforge package is a candidate task (separate repo).
4. **`SolEngine` constructor does DOM work** (CL-03) — queries canvas and builds renderer inline instead of an explicit `init()`. Orchestration itself is now fixed (SolOrchestrator, Phase 17); this is the last piece — small refactor inside the engine, mirror the `EnvironmentManager` init() fix.
5. **No `destroy()` method** — engines and controllers have no teardown. MPA navigation means Astro may not garbage-collect Three.js renderers and event listeners. Each needs a `destroy()` hooked to `astro:before-swap`. `CarouselPlanets.ts` also has no teardown — 8 WebGL contexts. Natural home now: the domain orchestrators.
6. ~~Entry file logic (main.ts)~~ — ✅ fixed 2026-07-06: `core/solar-system/SolOrchestrator.ts` created (wiring moved verbatim from main.ts, incl. `?target=` camera snap + compileAsync→loop.start warp sequencing); `main.ts` is bootstrap-only. All three entry files (landing/main/warp-router-init) now E-01 compliant. Note: `SolEngine` constructor still does DOM work (issue #4 remains). Orphaned original `sol-entry.ts` (pre-WarpRouter reverse-warp script; its `ex-warp-entry` flag had no writer) deleted same session. Entry files then renamed to the `{domain}-entry.ts` convention: `landing.ts`→`landing-entry.ts`, `main.ts`→`sol-entry.ts` (name reused for the new bootstrap-only entry — unrelated to the deleted file), `warp-router-init.ts`→`warp-entry.ts`. Astro imports updated in Main.astro, Landing.astro, neptune.astro.
7. **Planet journal pages are stubs** — Venus through Neptune need journal/portfolio content pages equivalent to `/mercury`.
8. **Article placeholder images** — `index.astro` Beat 06 references 5 SVG placeholders at `public/images/articles/article-0{1-5}.svg` (added Phase 14). Real article imagery still needed for final content pass.
9. ~~`Timer.elapsedTime` type error~~ — ✅ fixed 2026-07-06: the offending loop code was replaced by `animations/landing/LandingRenderLoop.ts`, which uses `getElapsed()`/`getDelta()`. `LandingEngine.clock` removed (unused).
10. **Camera near plane 0.1 / far 1000** (`SolEngine`) — poor depth precision at distance; root cause of the cloud-shell z-fighting (worked around per-material with polygonOffset). Raising near to ~1 would fix globally — developer call.

---

## Coding Standards System

A universal, portable coding standards system lives in `coding-standards/`. It is auto-loaded every Claude Code session via `CLAUDE.md` at the project root. No manual loading required after the first session.

### Structure

```
coding-standards/
├── index.md                        — Central node, reading order, file-to-role map
├── css-standards.md                — Global CSS laws (22 rules)
├── css-standards/                  — CSS file-role partials
│   ├── token-files.md
│   ├── layout-files.md
│   ├── component-files.md
│   ├── overlay-files.md
│   └── utility-files.md
├── html-standards.md               — Global HTML laws
├── html-standards/                 — HTML file-role partials
├── js-standards.md                 — JS only standard
├── js-standards/
├── ts-standards.md                 — TS only standard
├── ts-standards/
├── js-and-ts-standards.md          — JS + TS combined (ACTIVE for this project)
├── js-and-ts-standards/
│   ├── entry-files.md
│   ├── orchestrator-files.md
│   ├── class-files.md
│   ├── controller-files.md
│   ├── preset-files.md
│   ├── utility-files.md
│   ├── naming-conventions.md
│   └── decisions.md
├── git-standards.md
├── versioning-standards.md
├── seo-standards.md
├── performance-standards.md
├── accessibility-standards.md      — WCAG 2.1 AA
├── qa-standards.md                 — 24 rules, highest security level
├── ai-standards.md                 — [CX] hallucination detection, token efficiency
├── frameworks/
│   ├── astro.md
│   ├── astro/
│   └── bootstrap.md
├── CLAUDE.example.md               — Portable CLAUDE.md template (like .env.example)
└── README.md                       — Setup guide for using the system in any project
```

### Key Behavioural Rules

- Every Claude response begins with `[CX]` — if missing, discard the response and start a new session
- This project uses the **JS + TS combined** script standard (`js-and-ts-standards.md`)
- Data attributes are the **sole** state mechanism — never added/removed, always present with a default value, JS updates the value only
- CSS class chaining: `.card.card-hero` — never standalone modifier classes, never BEM `--modifier`
- No `!important` anywhere in project CSS
- Orchestrator pattern: `constructor` stores, `init()` acts — no DOM work in constructor

### Completed This Session

| Item | Status |
|---|---|
| All CSS, HTML, JS/TS, Git, Versioning standards | ✅ |
| SEO, Performance, Accessibility standards | ✅ |
| QA standards (24 rules, highest security) | ✅ |
| AI standards ([CX] detection, token rules) | ✅ |
| Framework standards: Astro + Bootstrap | ✅ |
| Script partials (entry, orchestrator, class, controller, preset, utility, naming, decisions) in all 3 script standard folders | ✅ |
| CLAUDE.md (auto-loads every session) | ✅ |
| CLAUDE.example.md (portable template) | ✅ |
| coding-standards/README.md (setup guide) | ✅ |

---

---

## Phase 15 — Triforge shader-core conversion (SUPERSEDED — do not act on this section)

> **2026-07-05:** This rejected first attempt was never rolled back file-by-file; it was **superseded** by the successful per-planet conversion (see the "fully converted" entries above). Every planet + the Sun now uses per-planet triforge builders in `objects/solar-system/{planet}/`, with shared low-level nodes in `shader-nodes/CoreShaderNodes.ts`. The rollback instructions below are obsolete — kept only for historical context. The **Triforge API facts** subsection at the end remains valid and current.

### What was done (historical)

All `onBeforeCompile` GLSL blocks were removed from every planet file and replaced with triforge `@triforge/shader-core` node-graph factory functions in a new central file `src/scripts/objects/PlanetShaders.ts`.

**Files changed (all need rollback to their pre-Phase-15 state):**
- `src/scripts/objects/PlanetShaders.ts` — NEW file, must be **deleted**
- `src/scripts/objects/Mercury.ts` — `_injectWorldNormalVaryings` + both `onBeforeCompile` blocks removed; terminator overlay mesh + `buildAtmoMaterial` call added
- `src/scripts/objects/Venus.ts` — same pattern
- `src/scripts/objects/Earth.ts` — same pattern (also uses `buildNightLayerMaterial`)
- `src/scripts/objects/Mars.ts` — same pattern
- `src/scripts/objects/Jupiter.ts` — same pattern
- `src/scripts/objects/Saturn.ts` — same pattern (oblate overlay meshes)
- `src/scripts/objects/Uranus.ts` — same pattern (oblate + ring kept)
- `src/scripts/objects/Neptune.ts` — same pattern (oblate)
- `src/scripts/objects/Sun.ts` — `MeshStandardMaterial` + `onBeforeCompile` replaced with `buildSunMaterial`
- `src/scripts/landing/CarouselPlanets.ts` — `atmoVert`/`atmoFrag` GLSL removed; `buildAtmoMaterial` import added; sun kept as-is with `onBeforeCompile`
- `src/scripts/animations/SunAnimation.ts` — texture pan now reads from `material.uniforms['uSunTex'].value` instead of `material.map`

### Why rollback is needed

The triforge conversion used a **universal `buildAtmoMaterial`** for all planets — one shared Fresnel formula. This is architecturally wrong: each planet has a unique, hand-tuned Fresnel and atmosphere look. A universal factory cannot represent that. The developer rejected the approach and wants:
1. All files restored to their original `onBeforeCompile` state
2. Then a proper per-planet triforge approach designed from scratch

### How to roll back

There is **no git** on this project. To restore:
1. Read the original file contents from the JSONL session transcript at:
   `C:\Users\ibrah\.claude\projects\c--wamp64-www-My-Projects-Astro-planatarium-2\e4492b3a-d1ab-445d-814a-57279a6a9ec6.jsonl`
2. The transcript contains the pre-Phase-15 versions of all planet files (they were read at the start of that session before any edits)
3. Delete `src/scripts/objects/PlanetShaders.ts`
4. Restore each planet file and `Sun.ts`, `CarouselPlanets.ts`, `SunAnimation.ts`

### Triforge API facts confirmed (keep for next attempt)

- `CompileContext.resolveInput(socket)` is the **correct** public API for resolving any input socket in `compileCall` — handles connected sockets, uniform registration, and default literals. Do NOT use manual `socket.connection.node`/`socket.connection.name` — bypasses uniform registration and caused silent shader link failure in the original attempt.
- `OutputNode` is exported from `@triforge/shader-core` and can be subclassed for custom terminal nodes (e.g. `RgbaOutput` for per-fragment alpha control)
- `InputSocket.connection` is public (`OutputSocket | null`)
- `OutputNode.compile()` creates `new ShaderMaterial({ vertexShader, fragmentShader, uniforms })` — post-compile material properties (transparent, blending, depthWrite, side) must be set on `out.material!` after calling `out.compile()`
- Vertex shader computes: `vNormal` = world-space normal, `vPosition` = world-space position, `cameraPosition` available via Three.js prefix
- `THREE.AdditiveBlending` = `blendSrc: SRC_ALPHA, blendDst: ONE` — with `MaterialOutput` alpha=1.0, result = `color + dst` (pure additive). `RgbaOutput` with variable alpha also works.
- `THREE.MultiplyBlending` = `blendSrc: DstColor, blendDst: Zero` — outputs `src.rgb × dst.rgb`
- **`NormalMap` LIMITATION:** it is a procedural height-gradient node (`dFdx`/`dFdy` of a float Fac), NOT tangent-space texture normal mapping. It cannot consume `8k_earth_normal_map.jpg` — the Earth surface conversion drops the normal map (was `normalScale 0.75`, subtle).
- **Earth fully converted (2026-07-05):** all four Earth layers (surface `EarthSurface.ts`, clouds `EarthClouds.ts`, night `EarthNight.ts`, atmosphere `EarthAtmosphere.ts`) are triforge node graphs; shared nodes (`RgbaOutput`, `buildTerminatorNodes`) in `EarthShaderNodes.ts`. All Earth files live in `src/scripts/objects/earth/` (incl. `Earth.ts` itself) — use the same per-planet folder pattern for the other conversions.
- **Mercury fully converted (2026-07-05):** `objects/mercury/` — `Mercury.ts`, `MercurySurface.ts` (PrincipledBSDF, roughness 0.75, metallic 0.25, emissive #fff5eb × 0.025, terminator band ±0.15), `MercuryAtmosphere.ts` (fresnel pow 6, glow [0.8, 0.9, 1.0], band 0.0→0.15 — night-rim fix applied). `MercuryAnimation._updateSunDirection()` added. Shared nodes promoted to `shader-nodes/CoreShaderNodes.ts` (`RgbaOutput`, `buildTerminatorNodes`) — all planet conversions import from there. `RgbaOutput.alpha` accepts a plain number for constant opacity.
- **`vector` socket dead-end BUG:** `vector` sockets are vec2 (`SOCKET_GLSL_TYPE`) but no process node outputs vec2 — even `Mapping` outputs vec3 `color`, so nothing in the package can legally feed `ImageTexture.vector`. UV panning (THREE.Texture.offset is ignored by raw ShaderMaterials) needs the custom `UvPan` node in `shader-nodes/CoreShaderNodes.ts` — float x/y inputs are live uniforms, keyframe `node.parameters` instead of `map.offset`.
- **Neptune fully converted (2026-07-05):** `objects/neptune/` — same recipe as Saturn/Uranus (`NeptuneSurface.ts` emissive #1a3a9a × 0.25, night tint [0.01, 0.01, 0.04]; `NeptuneClouds.ts` additive alpha 0.35; `NeptuneAtmosphere.ts` glow [0.2, 0.4, 1.0]). Oblate (1, 0.983, 1) + 28.32° tilt preserved. `.surfacePan`/`.cloudPan`; `NeptuneAnimation` retargeted + `_updateSunDirection()`. **All 8 planets are now triforge node graphs.**
- **Sun fully converted (2026-07-05):** `objects/sun/` — `SunSurface.ts` (emissive core tex × [1, 0.533, 0] × 10 × exposure 2.0 → ACES → Gamma 1/2.2; white rim mix `pow(rim, 1.5)`; edge-fade alpha `smoothstep(0, 0.02, N·V)`; UvPan). `Sun.material` getter replaced by `.surfacePan`; `SunAnimation` tex-pan retargeted. Sprites (blur/halo/rays) + PointLight unchanged. **Remaining raw GLSL: `CarouselPlanets.ts` only (carousel sun material + Fresnel atmo).**
- **Vite optimizeDeps expanded (2026-07-05):** `@strata-packages/offcanvas`, `@strata-packages/modal`, `three/addons/controls/OrbitControls.js`, `@triforge/shader-core` added to `optimizeDeps.include` — these were discovered mid-session, triggering re-optimization and "504 Outdated Optimize Dep" in open tabs. After big refactors while dev server runs: stop server → `rm -rf node_modules/.vite` → restart → hard refresh (order matters; clearing while running is rebuilt stale).
- **Landing asteroids detail pass (2026-07-05):** `ui/landing/LandingAsteroids.ts` — VARIANTS 1→4 (PER_VARIANT 25→6, distinct shapes/crater layouts), CRATER_N 5→11 + R_MIN 0.03 (crater saturation), normal map 512→1024px, tile 4×, relief strength 4.0. Second-pass candidates not done: procedural roughnessMap, per-instance `setColorAt` tinting.
- **Mercury two-octave bump (2026-07-05):** `TextureBump` gained optional `normal` input for chaining; Mercury runs coarse (lod 4, 1/128) + fine (lod 1, 1/512) octaves. Other planets stay single-octave — per developer instruction, bump tuning is per-planet only.
- **Folder restructure (2026-07-05):** scripts reorganised by domain — see Source File Map above. `landing/` folder dissolved; every file relocated by role with `solar-system/` + `landing/` subfolders in `core/`, `objects/`, `controllers/`, `ui/`; warp pair moved to `warp/` (site-wide effect subsystem, was misfiled in landing/). New `core/landing/LandingOrchestrator.ts` owns the landing dependency graph (closes E-01 for landing.ts — now bootstrap-only). Verified per stage with tsc + `astro build`. Assets unmoved: landing 3D is fully procedural; CarouselPlanets legitimately reuses solarsystem textures. `animations/` + `environment/` stay flat (100% sol) — split when landing files appear.
- **TextureBump custom node (2026-07-05):** stock `Bump` flickers at close range — dFdx of a bilinear sample is piecewise-constant, texel seams pop as they crawl across pixels. `TextureBump` in `shader-nodes/CoreShaderNodes.ts` samples the height texture at uv ± `texelSize` (finite differences, screen-independent); same cotangent frame + `strength × distance × 50` scaling as stock Bump so tuned values carry over. Needs its own sampler uniform (must not collide with ImageTexture's — set `material.uniforms[uniformName]` after compile, e.g. `uMercuryBumpTex` = same texture object). All four rocky planets swapped from RGBtoBW+Bump to TextureBump (texelSize 1/512, distance fade kept on strength).
- **Z-fighting fix (2026-07-05):** far-view speckle on layered planets was cloud-shell z-fighting (shells sit 0.0015 above the surface; camera near 0.1 / far 1000 leaves no depth precision at distance). Fix: `polygonOffset = true, factor/units = -2` on all thin shells — Jupiter/Saturn/Uranus/Neptune/Venus clouds, Mars dust, Earth night layer; Earth clouds get −4 (they sit above the night shell). Atmosphere shells not offset (fresnel alpha ≈ 0 face-on, fighting invisible). Raising camera near plane (0.1 → 1) would be a global cure — developer call, not applied.
- **Bump distance fade (2026-07-05):** far-view speckle artifacts = dFdx/dFdy derivative aliasing in the Bump node at texture minification. Fix: `buildBumpFadeStrength({ strength, fadeStart, fadeEnd })` in `shader-nodes/CoreShaderNodes.ts` (CameraData.ViewDistance → Clamp → MapRange inverted) drives `Bump.strength` — full bump below fadeStart (5), zero at fadeEnd (14). Applied to Mercury/Venus/Earth/Mars surfaces. Also `texture.anisotropy = 16` on all planet surface/cloud textures (+ Saturn ring) — reduces general minification shimmer incl. on gas giants (which have no Bump).
- **ACES tone mapping as nodes:** `buildAcesToneMapNodes(colorSocket)` in `shader-nodes/CoreShaderNodes.ts` — per-channel Narkowicz ACES via ShaderMath nodes. Sun uses it at full original values. The 8 planets still use the simpler `Gamma(1/1.75)` approximation — swap in ACES if their colours read off at the visual pass.
- **Uranus fully converted (2026-07-05):** `objects/uranus/` — same recipe as Saturn (`UranusSurface.ts` emissive #6dcfcf × 0.25, night tint [0.01, 0.03, 0.04]; `UranusClouds.ts` additive alpha 0.3; `UranusAtmosphere.ts` glow [0.45, 0.85, 0.88]). Canvas-generated ring stays `MeshBasicMaterial`. Oblate scale (1, 0.977, 1) + 97.77° tilt preserved. `.surfacePan`/`.cloudPan` getters; `UranusAnimation` retargeted + `_updateSunDirection()`.
- **Saturn fully converted (2026-07-05):** `objects/saturn/` — same recipe as Jupiter (`SaturnSurface.ts` emissive #c8b080 × 0.025, night tint [0.04, 0.03, 0.01]; `SaturnClouds.ts` additive alpha 0.4; `SaturnAtmosphere.ts` glow [0.85, 0.75, 0.55]). Oblate `geometry.scale(1, 0.902, 1)` unaffected (triforge vertex shader uses inverse-transpose modelMatrix). Ring stays `MeshBasicMaterial` (no GLSL). `.surfacePan`/`.cloudPan` getters; `SaturnAnimation` retargeted + `_updateSunDirection()`. `PannableMaterial` interface moved to `shader-nodes/CoreShaderNodes.ts`.
- **Jupiter fully converted (2026-07-05):** `objects/jupiter/` — `JupiterSurface.ts` (emissive #c8a882 × 0.025, band ±0.4, night tint [0.05, 0.03, 0.02], no Bump — gas giant, `PannableMaterial` return: `{ material, pan }`), `JupiterClouds.ts` (same tex, additive blending, constant alpha 0.4, own UvPan), `JupiterAtmosphere.ts` (glow [0.9, 0.7, 0.5], band 0.0→0.4). `Jupiter.material`/`.cloudMaterial` getters replaced by `.surfacePan`/`.cloudPan` (Record<string, number>); `JupiterAnimation` tex-pan/cloud-pan tracks retargeted from `map.offset` to the pan records, `_updateSunDirection()` added.
- **Mars fully converted (2026-07-05):** `objects/mars/` — `MarsSurface.ts` (emissive #c1622a × 0.15, band ±0.4, night-side red tint [0.08, 0.02, 0.01] × (1−terminator) added post-shadow, Bump), `MarsDust.ts` (dust tex × 0xffd4a0 tint × terminator, alpha = 0.25 × tex.g), `MarsAtmosphere.ts` (glow [0.75, 0.35, 0.15], band 0.0→0.4, night-rim fix). `MarsAnimation._updateSunDirection()` added.
- **Venus fully converted (2026-07-05):** `objects/venus/` — `VenusSurface.ts` (same recipe as Mercury incl. Bump, band ±0.4), `VenusClouds.ts` (cloud tex × 0xffe8a0 tint × terminator, constant alpha 0.75), `VenusAtmosphere.ts` (glow [1.0, 0.85, 0.6], band 0.0→0.4, night-rim fix). `VenusAnimation._updateSunDirection()` added. Bump nodes also added to `EarthSurface.ts` and `MercurySurface.ts` (strength 0.15, distance 0.015 — developer-tuned). `PrincipledBSDF`'s `uSunDirection` uniform is updated per frame in `EarthAnimation._updateSunDirection()` (sun at origin → `normalize(-earthWorldPos)`). Tone mapping/sRGB approximated with `Gamma(1/1.75)` nodes (developer-tuned). Template for the other planets.
- **`MapRange` BUG:** `_st_mapRange` applies the SMOOTHSTEP/SMOOTHERSTEP polynomial to the unclamped `t`, clamping only afterwards — out-of-band inputs invert (below `fromMin` → 1, above `fromMax` → 0). Workaround: feed the value through a `Clamp` node pinned to `[fromMin, fromMax]` before `MapRange` (see `EarthAtmosphere.ts`).

---

## Phase 16 — Landing animation-layer split + warp/carousel triforge conversion ✅ (2026-07-06)

**Animation folder split by domain** (per the "split when landing files appear" note):
- `animations/solar-system/` — all 11 pre-existing sol files moved, relative imports bumped one level, `main.ts` imports updated
- `animations/landing/LandingRenderLoop.ts` — NEW: the single landing rAF loop (was inline in `LandingOrchestrator._startRenderLoop`, JT-O-01 violation). Owns a `THREE.Timer`, uses `getElapsed()` correctly (closes loose end #9). Ticks asteroids animation, scroll camera, carousel planets, then renders.
- `animations/landing/LandingAsteroidsAnimation.ts` — NEW: spin/tumble math moved out of `objects/landing/LandingAsteroids.ts` (object files hold geometry/materials only, sol pattern). `LandingAsteroids` now exposes `meshes`/`instances` getters; `AsteroidInstance` exported.
- `CarouselPlanets` lost its private rAF loop + Timer — now `update(elapsed)` driven by LandingRenderLoop (one rAF chain per page; also removed the `elapsedTime` any-cast).
- Scroll binding moved from orchestrator into `LandingScrollCamera.init()` (JT-O-01). `NebulaScene.update()` no-op removed. `LandingEngine.clock` removed (unused).
- `LandingOrchestrator` is now pure wiring (`_prefetchSol` DOM one-off remains — flagged, developer call).

**Warp shader → triforge** (`src/scripts/warp/WarpShaderNodes.ts`, NEW):
- `WarpStarfield` custom ProcessNode — the 16-layer × 3×3-cell star-field loop lives in `compileDefs` (node graphs cannot loop; same encapsulation pattern as `TextureBump`). Inputs speed/time/aspect/opacity/fade/color are unconnected → auto-registered live uniforms; `node.parameters` is a 1:1 replacement for the old uniforms block. Outputs: Color, Tint, Lum, Radius, RadiusNorm + Speed/Opacity/Fade passthroughs for graph fan-out.
- `buildWarpMaterial(aspect)` — core glow, tunnel vignette, chromatic fringe, and veil are genuine node graphs (ShaderMath/VectorMath/MapRange/SeparateRGB/CombineRGB → RgbaOutput). smoothstep = Clamp→MapRange (clamp-order bug workaround) via local `buildSmoothstep` helper.
- `WarpTransition.ts` — ~170 lines of GLSL deleted; material from `buildWarpMaterial`; uniform writes → `this._params.*`; `setColor` → `params.color = [r,g,b]`; resize updates `params.aspect`. Fullscreen quad now sits at `mesh.position.z = -0.5` inside the ortho frustum (triforge vertex shader projects through camera matrices, unlike the old passthrough vertex shader).

**Carousel GLSL → triforge** (`src/scripts/objects/landing/CarouselPlanetMaterials.ts`, NEW):
- `buildCarouselAtmosphereMaterial(color, intensity)` — fresnel pow 5 rim, additive, replaces `atmoVert`/`atmoFrag`
- `buildCarouselSunMaterial(texture)` — SunSurface recipe at carousel values (emissive 0xff8800 × 8 × exposure 1.4 baked as [11.2, 5.97, 0], in-graph ACES + Gamma 1/2.2, rim-white mix pow 1.5, edge-fade alpha). Replaces the last `onBeforeCompile` in the project.
- Verified: `astro build` ✓; node-graph smoke test (tsx) confirms all three materials compile and `parameters` mutation is live. Visual pass done 2026-07-06 — warp and carousel confirmed correct in the browser.

**Environment folder split by domain** (same session, follow-up):
- `environment/solar-system/EnvironmentManager.ts` — moved; CL-03 fixed (constructor no longer runs `_setup()`; explicit `init()` called from main.ts)
- `environment/landing/LandingEnvironment.ts` — NEW: landing scene environment (backdrop + global lighting), mirrors the sol manager. Owns `NebulaScene` (moved here from `objects/landing/` — it's a backdrop, not a scene object) and the ambient + directional sun lights **moved out of `LandingAsteroids`** (an object file was creating scene-wide lights). Sun angle constants (`SUN_H_DEG`/`SUN_V_DEG`/`SUN_INT`/`AMB_INT`/`SUN_COLOR`) moved with the lights.
- `LandingOrchestrator` wires `LandingEnvironment` before scene objects.
**Shader-node layer promoted to top level** (same session):
- `objects/shader-nodes/PlanetShaderNodes.ts` → `shader-nodes/CoreShaderNodes.ts` (~26 import paths updated). Rationale: the file defines no scene objects (node classes + sub-graph builders only) and is consumed by all three shader domains (solar-system, landing carousel, warp) — role = shared shader toolkit, like `warp/` is a shared effect subsystem. `WarpShaderNodes.ts` stays in `warp/` (single consumer — domain-local by the "promote only when shared" rule, same as the old `EarthShaderNodes` precedent).

- Note: the milky-way "HDR" is actually an 8-bit JPG on `scene.background` only — no `scene.environment`/IBL anywhere (and node-graph ShaderMaterials would ignore it). Real HDR/IBL is a non-goal until a material needs reflections.

---

## Phase 17 — Sol orchestrator, core renames, entry-file convention ✅ (2026-07-06)

**SolOrchestrator extracted** (closes loose end #6):
- `core/solar-system/SolOrchestrator.ts` — NEW: all wiring moved from main.ts (engine → environment → objects → controllers → animations → 9 scroll cams → RenderLoop). `?target=` camera snap in `_snapToTarget()`, explore-mode event dispatch in `_enterExploreMode()`. **Warp-critical sequencing preserved exactly**: snap camera → `compileAsync` → `loop.start()` + ExploreOverlayController.
- The 9 identical `new PlanetScrollCamera(...)` lines became a `cam()` factory + named record — same instances, same positional order into RenderLoop/ExploreOverlayController.

**Renames:**
- `PlanetariumEngine.ts` → `SolEngine.ts` (class `SolEngine`) — matches the `{Domain}Engine` pattern. All references updated (code, handover, CLAUDE.md, memory).
- Entry files → `{domain}-entry.ts` convention: `landing.ts`→`landing-entry.ts`, `main.ts`→`sol-entry.ts`, `warp-router-init.ts`→`warp-entry.ts`. Astro imports updated (Main.astro, Landing.astro, neptune.astro, WarpOverlay.astro comment). All three are bootstrap-only (E-01 ✅).
- Orphaned original `sol-entry.ts` (pre-WarpRouter reverse-warp script, imported by nothing, its `ex-warp-entry` flag had no writer) deleted **before** the rename — today's `sol-entry.ts` is the new bootstrap entry, unrelated.

**Architecture decisions recorded this session:**
- Entry files stay at `scripts/` root — they are the public surface Astro pages import; no `entries/` or "router" naming (routers make destination choices; entries make none — `WarpRouter` is the only true router).
- A single universal `app-entry.ts` (DOM-sniffing + dynamic imports) was considered and **rejected** — worth revisiting only at 10+ page types.
- `core/{domain}/` deliberately pairs engine + orchestrator: engine owns the render context, orchestrator owns the dependency graph, orchestrator is the engine's only consumer.
- Shared-node modularity rule reaffirmed: helpers are born planet-local and only promoted to `shader-nodes/CoreShaderNodes.ts` once a second consumer proves them generic (Earth precedent). CoreShaderNodes must never gain planet-specific logic.

**End state — full domain symmetry, all builds verified:**
```
landing-entry.ts → LandingOrchestrator → LandingEngine   (core/landing/)
sol-entry.ts     → SolOrchestrator     → SolEngine       (core/solar-system/)
warp-entry.ts    → WarpRouter          → WarpTransition  (warp/)
```

**Discrepancy noted:** `src/pages/` contains only `index.astro`, `sol.astro`, `neptune.astro` — the Source File Map's claim of "venus.astro … neptune.astro — 7 planet pages" is stale. Confirm with developer whether pages were deliberately removed, then fix the map.

---

## Portfolio direction (brainstorm 2026-07-05, decisions pending)

Site is being repurposed as a live portfolio carrying real work + GitHub data. Key facts:
- GitHub `AftabIbrahimKazi`: 2 public repos — `strata` (CSS framework, powers this site's utility layer) and `triforge` (Three.js node system, renders this site's planets). **The portfolio literally runs on the owner's own open-source work — that's the core story.**
- GitHub profile itself is bare (no name/bio/location) — fill before linking to it.
- Recommended approach for live repo data: **build-time fetch** in Astro frontmatter (SSG, no client JS, no rate limits; stale only until next build).
- Proposed planet mapping: Sun=About+"built with my own tools" hook, Earth=Strata deep-dive, Mars=Triforge (this site as live demo), Venus=this site's design system, Mercury=real articles (material exists: framework-building, shader debugging war stories). Jupiter/Saturn/Uranus need developer input or consolidation.
- **Open decisions for the developer:** (1) merge/keep Saturn+Uranus+Neptune sections? (2) any non-public client work to represent? (3) journal articles — write real ones or defer?

---

## Next Up

### Real content population (next session)

All planet overlays currently contain placeholder copy. The next session will replace all placeholder text with actual portfolio content across every planet.

**Sun (About):** bio, methodology, stack, highlights, values
**Venus (Design):** design projects, process, branding work, systems, motion
**Earth (Dev):** development projects, stack, open-source contributions
**Mars (Labs):** experiments, tools, creative coding work
**Jupiter (Enterprise):** enterprise clients, methodology, results, industries
**Saturn (Products):** digital products, pricing, licensing, reviews
**Uranus (Concepts):** speculative concepts, design fiction, ideation process
**Mercury (Journal):** article cards — real titles, excerpts, dates, categories, images

**Also needed:**
- Real article images to `public/images/articles/` (currently 404)
- Sidebar `items[]` arrays in each `{Planet}Overlay.astro` to match real content
- Landing page Beat 01–04 placeholder text (hero heading, stats, work pills)

**Deferred but not forgotten:**
- `@strata-packages/modal` — installed, not yet wired
- Create journal/blog pages for Venus → Neptune (matching `/mercury` pattern)
- `@triforge/compositor-core` post-processing (bloom, vignette, film grain)
- `destroy()` methods on all engines + `astro:before-swap` cleanup
- Section-by-section strata utility audit (landing page beats)
- Asteroid belt page / section
