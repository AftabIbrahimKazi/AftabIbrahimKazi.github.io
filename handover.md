# Handover — Exo Space Planetarium

**Date:** 2026-06-21
**Last updated:** 2026-07-12 — Phase 23: pre-release production-readiness audit of the live site, root-caused and fixed a real horizontal-scroll bug plus several dead links/forms on the `/neptune` contact page, wired both dead newsletter/contact forms (Mercury, Venus) and the Neptune contact form to a `mailto:` fallback (static GitHub Pages has no backend), and replaced every remaining bracket-placeholder / meta-instructional copy across Sun, Earth, Mars, Jupiter, Saturn, and Uranus with concrete example content. Uncommitted on `dev` — see Phase 23 below for the full list before committing/pushing. Phase 22 (replicating the Mercury/Venus Explore pattern to the other 7 planets) is already committed and live on `main`.
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
| @triforge/shader-core | 0.4.1 | All 9 planet materials + warp + carousel (fully integrated) |
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

### Phase 20 — Mercury "Explore" scroll redesign ✅

Full redesign of the `/sol?target=mercury` scroll experience — camera, layout, pagination, and article reading, done in 6 staged commits-worth of work (all in one uncommitted session, see below). Scoped entirely to Mercury; no other planet's scroll camera, overlay, or sidebar was touched.

**Camera (`PlanetScrollCameras.ts`, `MERCURY_SCROLL_PATH`):**
- Replaced the old 10-waypoint dramatic path (underside look-up, top-down pole shot, opposite-side flips) with a single continuous 360° circular orbit in the x/z plane, radius exactly 5 at every waypoint (previously inconsistent radii caused a dolly in/out "pulse" — fixed by keeping all 10 mid-waypoints on one true circle).
- Radius now *breathes*: 5 at the start/end waypoints, dipping to 1.8 at the halfway waypoint (S6) for an immersive close pass, then back out — still one continuous orbit, not a separate zoom.
- `lookAt` on each waypoint is nudged off-planet-center along that waypoint's own camera-right vector (computed per-angle, peaking at S6, zero at the start/end) so the planet visually drifts left in frame during the close pass — clears the right-aligned content cards instead of being hidden behind them.
- **Root-caused and fixed a real performance bug this surfaced**: `SolOrchestrator.init()`'s `renderer.compileAsync(scene, camera)` only precompiles shaders visible from the *entry* camera pose; the Sun (world origin) was never in that frustum, so it lazy-compiled (blocking, on-thread) the first time an orbit swung around to face it. Fixed with a second temporary `compileAsync` pass aimed at the Sun before `loop.start()`, camera restored after — invisible to the user, no waypoint changes needed.
- Also fixed (unrelated, found via the same investigation): `InteractionController`'s hover raycaster was picking the Sun's oversized glow sprites (scale up to 13.5–26 vs. the sphere's radius-2), making the tooltip trigger far outside the visible star. Fixed by setting `sprite.raycast = () => {}` on all three Sun glow sprites (`Sun.ts`) — sprites are now visual-only, raycasting only ever hits the actual sphere.

**Layout (`MercuryOverlay.astro`, `mercury-overlay.css`):**
- The old zigzag (`top-left`/`bottom-right`/`bottom-left`/`left`/`right` — 5 variants) collapsed to a single `data-layout="right"` for all 8 middle sections; sections 1 and 10 stay centered (`bottom-center`/`center`, unchanged — they already matched the desired "intro/outro" treatment).

**Progress strip (new: `MercuryProgressStrip.ts`, markup lives in `ContentOverlay.astro` as a top-level sibling of `#ex-content-overlay`, not nested inside it — same containing-block reason the article sidebars already lived there: a `position:fixed` descendant of a `transform`/`will-change:transform` ancestor is fixed to *that ancestor*, not the viewport):**
- Numbered pagination (01–10 + a topic label per section), fixed left-center, dual-role: paginates the 10 scroll sections by default; when the article panel opens it relabels (fade transition via `data-swapping`) to paginate that article's paragraphs instead (extra dots past the paragraph count hidden via `data-in-range`), then relabels back on close.
- Active-item tracking is a plain `scroll` listener + nearest-to-viewport-center `getBoundingClientRect` calculation (matching `PlanetScrollCamera`'s existing `overlay.scrollTop` pattern) — not `IntersectionObserver`, which silently broke here because its `root` must be the actual scrolling element and one of ours wasn't.
- A left-edge gradient backdrop (`color-mix()`-stepped, no plain two-stop cutoff) sits behind it for legibility; both backdrop and strip fade + slide in/out with the overlay open/close state via a CSS sibling selector (`#ex-content-overlay[data-overlay-state="open"][data-planet="ex-mercury-js"] ~ .ex-mercury-progress-strip`), no JS show/hide.
- Fixed a real alignment bug: the bullet's negative-margin trick interacted badly with the grid's `auto`-sized column (each button is an independent grid, so the computed column width drifted slightly per item) — replaced with a fixed-length first track (`grid-template-columns: var(--ex-space-xxs) auto`), which guarantees identical text start position on every row.

**Article reading (`ContentOverlay.astro`, `MercuryOverlay.astro`):**
- The old left/right offcanvas sidebar pair is now a single full-width panel that slides up from the bottom, using `@strata-packages/offcanvas`'s *native* `data-st-side="bottom"` support (its own CSS drives the slide purely off `aria-hidden` — no custom state attribute needed) and its real `st:offcanvas:open`/`st:offcanvas:close` events (not a `MutationObserver` — the package already fires these).
- Background is responsive-conditional, not a blanket choice: transparent/immersive (no card chrome) at ≥1200px where there's room to avoid overlap; translucent + blurred (`--ex-color-mercury-bg` + `blur(24px)`) below that, since on narrow/short viewports the panel's own text was otherwise colliding illegibly with the section content and site chrome behind it.

**Also fixed as a drive-by (found via mobile testing):** `Main.astro` was still rendering a legacy pre-`LandingHeader`/`LandingFooter` `Header.astro`/`Footer.astro` pair (stray "FAQ / Contact Us / Whats New!" footer bleeding through on mobile, nothing hid it). Commented out (not deleted) in `Main.astro` — affects all planet pages, not just Mercury, since they share this layout.

**Responsive:** breakpoints follow the existing project convention (`575.98px`/`767.98px`/`991.98px` brackets). Strip drops number+label progressively (bullets-only at SM, +number at MD), then hides entirely at XS; sections and the article panel's `padding-left` shrink to match at each step.

**Compliance pass done:** no `!important`, no inline styles anywhere touched, all state via `data-*` **value** changes only (never added/removed), the one raw pixel value introduced (`320px` backdrop width) replaced with the existing `--ex-size-lg` token, two stray `line-height` declarations carried over from the sidebar rename removed (line-height stays `.ex-body`-only per standard), and `.ex-mercury-article-panel-inner`'s static flex/height/overflow properties converted to strata utility classes (`d-flex flex-column h-100 overflow-y-auto`) — everything else (transitions, transforms, gradients, `display:grid`, per-breakpoint padding) stays custom CSS since strata has no utility equivalent and converting risked breaking the animations.

**Not done — deferred to next session:** all Mercury article body copy is still placeholder/dummy text (the original 4-article dataset). Real content pass is next.

---

## Known Remaining Issues / Loose Ends

1. ~~`@triforge/radius-parametric-geometry` import in planet files~~ — ✅ removed during the 2026-07-05 planet conversions.
2. **`compositor-core` not wired up** — Bloom, Vignette, FilmGrain can be added to `EnvironmentManager.ts` now that 0.1.1 is stable.
3. ~~`onBeforeCompile` raw GLSL in planet files~~ — ✅ Sun + all 8 planets are triforge node graphs. ~~CarouselPlanets + WarpTransition raw GLSL~~ — ✅ both ported 2026-07-06 (Phase 16). **Updated 2026-07-07 (Phase 18):** `RgbaOutput` and `UvPan` retired entirely. ~~`TextureBump` blocked on upstream bug~~ — ✅ **resolved 2026-07-08 (Phase 19):** `@triforge/shader-core` 0.4.2 fixed the `Bump({method:'uv-offset'})` extension-ordering bug; Mercury/Venus/Mars swapped to the stock node, `TextureBump` deleted. `CoreShaderNodes.ts` now contains zero raw GLSL. `WarpStarfield`'s raymarch loop in `WarpShaderNodes.ts` remains raw GLSL by permanent design (node graphs cannot express loops) — not tech debt, will never retire.
4. **`SolEngine` constructor does DOM work** (CL-03) — queries canvas and builds renderer inline instead of an explicit `init()`. Orchestration itself is now fixed (SolOrchestrator, Phase 17); this is the last piece — small refactor inside the engine, mirror the `EnvironmentManager` init() fix.
5. **No `destroy()` method** — engines and controllers have no teardown. MPA navigation means Astro may not garbage-collect Three.js renderers and event listeners. Each needs a `destroy()` hooked to `astro:before-swap`. `CarouselPlanets.ts` also has no teardown — 8 WebGL contexts. Natural home now: the domain orchestrators.
6. ~~Entry file logic (main.ts)~~ — ✅ fixed 2026-07-06: `core/solar-system/SolOrchestrator.ts` created (wiring moved verbatim from main.ts, incl. `?target=` camera snap + compileAsync→loop.start warp sequencing); `main.ts` is bootstrap-only. All three entry files (landing/main/warp-router-init) now E-01 compliant. Note: `SolEngine` constructor still does DOM work (issue #4 remains). Orphaned original `sol-entry.ts` (pre-WarpRouter reverse-warp script; its `ex-warp-entry` flag had no writer) deleted same session. Entry files then renamed to the `{domain}-entry.ts` convention: `landing.ts`→`landing-entry.ts`, `main.ts`→`sol-entry.ts` (name reused for the new bootstrap-only entry — unrelated to the deleted file), `warp-router-init.ts`→`warp-entry.ts`. Astro imports updated in Main.astro, Landing.astro, neptune.astro.
7. ~~Mercury journal running on 4-article placeholder dataset~~ — ✅ replaced with 7 real blog posts (session prior to Phase 22). **Venus** (Phase 21) has real-shaped project cards but `image`/`demoUrl` are still `null` on every project — see Next Up. Earth/Mars/Jupiter/Saturn/Sun/Uranus got concrete example content in Phase 23 (still dummy, not final — see Next Up).
8. **Article placeholder images** — `index.astro` Beat 06 references 5 SVG placeholders at `public/images/articles/article-0{1-5}.svg` (added Phase 14), reused across all 7 real Mercury blog posts (some SVGs used twice). Real article imagery still needed.
9. ~~`Timer.elapsedTime` type error~~ — ✅ fixed 2026-07-06: the offending loop code was replaced by `animations/landing/LandingRenderLoop.ts`, which uses `getElapsed()`/`getDelta()`. `LandingEngine.clock` removed (unused).
10. **Texture load time on the live site** (noted 2026-07-06, post GitHub Pages launch) — page loads under 2s but the 8k planet textures visibly lag in after it. Candidates for the fix: downscale (2k/4k is enough at these render sizes — the carousel minis are 90px), convert JPG → WebP/AVIF or KTX2 with mip chains, lazy-load per planet instead of all upfront, and/or a loading progress veil so the lag reads as intentional. Address in the performance pass (roadmap P3). Worst case observed: the landing carousel planets pop in one by one on the live site — each of the 8 mini WebGL scenes loads the full-size solar-system texture (Earth alone pulls ~16 MB incl. the 8k cloud layer) to fill a 90px canvas, and appearance order = download-completion order. Carousel-specific fix: dedicated 256–512px thumbnail textures (entire strip would then load faster than one current planet) + per-planet fade-in so residual stagger reads as intentional. **Chosen approach (2026-07-06): progressive texture loading** — generate tiny (128–256px, ~10–20KB) versions of each texture; a `ProgressiveTextureLoader` utility loads the tiny one first (planet renders instantly, soft), full-res downloads in background and swaps into the same uniform (`needsUpdate = true`). Caveats: rocky planets have a second sampler uniform (`Bump`'s `uniformName`) pointing at the same texture — the swap must update both; carousel may not need the full-res swap at all (90px canvases). **Must include retry-on-error with backoff**: live site observed a GitHub Pages CDN 503 on `8k_earth_daymap.jpg`, and every `TextureLoader.load()` in the project is currently fire-and-forget — one transient failure permanently blanks a planet until refresh. With the placeholder-first design, a failed full-res fetch degrades to "slightly soft planet" instead of "black planet".
11. **Camera near plane 0.1 / far 1000** (`SolEngine`) — poor depth precision at distance; root cause of the cloud-shell z-fighting (worked around per-material with polygonOffset). Raising near to ~1 would fix globally — developer call.
12. **Landing page orb atmosphere Fresnel renders as a full ring, not a one-sided glow** (`.lp-journal-orb` Mercury, `.lp-comm-orb` Saturn — see Phase 19). `buildCarouselAtmosphereMaterial()` is a pure view-angle Fresnel with no light-direction awareness; imperceptible at the 120px carousel scale, clearly a full ring at 300–520px. Needs *some* directional input to favor one limb (the scene's own `DirectionalLight`, or a fixed camera-space mask) — developer has not yet confirmed which, explicitly deferred this session. Do not implement without that confirmation.
13. **No sitemap** — `robots.txt` added Phase 23, but sitemap generation needs a new `@astrojs/sitemap` dependency (or equivalent), not added since a bug-fix pass shouldn't introduce new dependencies. Low priority for a portfolio site (recruiters don't discover via search crawl), but worth adding eventually.
14. ~~Phase 22 merged `dev` directly into `main`, skipping `test`/`beta`~~ — violated `git-standards.md` RULE G-02, caught after the fact during the Phase 23 audit; `test`/`beta` fast-forwarded to resync. Not a code issue, but a process one — confirm the PR target branch before merging next time, not after.

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

## Phase 18 — shader-core 0.3.0 regression fix, ghost-planet bug, custom-node retirement (2026-07-07)

**Root cause found — every planet rendered as a flat, textureless "ghost" sphere:**
Somewhere between 0.2.1 and 0.3.0, `MaterialOutput.surface` started requiring a `shader` socket (vec4, for the alpha-plumbing work), but all 8 planet surface builders fed it a plain `Gamma` node output (`color`, vec3). Mismatch: `gl_FragColor = <vec3>;` — a real dimension-mismatch fragment shader compile failure, confirmed via a headless-browser check (`THREE.WebGLProgram: Shader Error 0`). WebGL silently fails to render the mesh's real material, so every planet showed only its atmosphere fresnel shell over a flat grey/white base.

**Fix:** wrapped each surface's final `Gamma` output through an `Emission` pass-through (`color * 1.0`, which legitimately outputs `shader`/vec4) before `MaterialOutput`, in all 8 `{Planet}Surface.ts` files. Verified per-planet in-browser — real texture detail, correct day/night terminator shading restored.

**Also fixed while in there:** Mars/Jupiter/Saturn/Uranus/Neptune each had a second, hardcoded `nightTint` emission node (independent of `buildNightAmbient`) that kept their night sides glowing even after zeroing the shared ambient default — removed, night hemispheres are now true black on request.

**`@triforge/shader-core` 0.3.0 → 0.4.1**, driven by three prompts sent to the triforge repo asking for generalized fixes to the gaps `RgbaOutput`/`UvPan`/`TextureBump` existed to work around:

- **`RgbaOutput` retired.** 0.4.0 shipped `TransparentBSDF` (always `vec4(0,0,0,0)`) + confirmed `MixShader`'s existing vec4 mix works for alpha. Migrated all 16 usages (8 atmospheres, Earth clouds/night, Mars dust, 4 gas-giant clouds, Sun surface, both carousel materials, the warp veil) to `MixShader({ fac: alpha, shader1: TransparentBSDF, shader2: Emission(color) })` → `MaterialOutput`. `compile()` now auto-detects `transparent: true` via `wantsTransparency()` walking the graph — no more manual `material.transparent = true`. Class deleted from `CoreShaderNodes.ts`.
- **`UvPan` retired.** 0.2.1 already fixed vec3/vec2 implicit conversion at connection points (the original blocker); 0.4.0 added per-component parameter aliases (`parameters['location.x']`) on any vector uniform, closing the last gap (animating a single axis of `Mapping.location`). Added `buildUvPan()` to `CoreShaderNodes.ts` — wraps `TextureCoordinate → Mapping`, negates on read/write so `pan.x`/`pan.y` keep `UvPan`'s exact `vUv + offset` sign convention (`Mapping` computes `vector - location`). This preserved the external interface exactly — **all 5 `*Animation.ts` files needed zero changes**, since they only ever keyframed `pan.x`/`pan.y`. Migrated 9 usages (Sun/Jupiter/Saturn/Uranus/Neptune surfaces + 4 gas-giant clouds). Verified: zero runtime errors sustained across the full animation loop on all 5 pages (a broken parameter-alias wiring would throw immediately on the first `KeyframeTrack` write).
- **`TextureBump` — NOT retired, blocked.** 0.4.0's `Bump({method:'uv-offset'})` was supposed to be a drop-in replacement (same finite-difference/cotangent-frame math), but emits `#extension GL_EXT_shader_texture_lod : enable` after other shader code — ESSL3/WebGL2 rejects this (confirmed via actual shader compile failure on Mercury/Venus/Mars). Reported upstream; 0.4.1 attempted a fix but **only moved the bug** — the extension still lands after a `luminance()` helper (likely from three.js's own `ShaderMaterial` prefix chunk), re-confirmed via the same compile failure. Reverted Mercury/Venus/Mars back to `TextureBump` twice this session. Stays until the ordering bug is genuinely fixed — the real fix needs to hoist `#extension` above *everything* in the final compiled shader, including whatever three.js itself prepends, not just the library's own node-def collection.

**`WarpStarfield` migrated to `ShaderScript`** (`warp/WarpShaderNodes.ts`) — the library's existing OSL-Script-node equivalent, previously unused in this repo. The 16-layer × 3×3-cell raymarch loop is still hand-written GLSL (loops fundamentally can't be composable nodes — same limitation Blender's own shader editor has), but the ~34-line hand-rolled `ProcessNode` class shell (constructor, socket accessors, manual `compileCall` variable-declaration glue) is gone, replaced by one declarative `new ShaderScript({ defs, glsl, inputs, outputs })` call. Renamed `createWarpStarfield` → `buildWarpStarfield` (naming-standard fix, `create` isn't an approved verb prefix — see below).

**Standards-compliance fixes applied to this session's own new code** (per `ai-standards.md` / `js-and-ts-standards.md`, caught on request from a full standards read):
- Added justifying comments to two `as number` type assertions in `buildUvPan()` (RULE JT-TS-05 — every type assertion needs an inline reason).
- Renamed `createWarpStarfield` → `buildWarpStarfield` (RULE JT-N-03 — `create` is not an approved verb prefix; `build` matches this file's existing convention).

**State at end of session:** all changes above are uncommitted on `dev`. Build passes (`npm run build`), verified in-browser with zero console/shader errors across all 9 planets + warp transition. Not yet pushed — do that as an explicit next step, following `git-standards.md` (version bump at push time, `dev → test → beta → main`, never direct to `main`).

---

## Phase 19 — TextureBump retirement, warp flash-of-content fix, journal Mercury bump (2026-07-08)

**`TextureBump` retired — last custom raw-GLSL node gone from `CoreShaderNodes.ts`:**
Reported the exact bug upstream (Bump's uv-offset mode unconditionally emitted `#extension GL_EXT_shader_texture_lod : enable`, which is dead weight on WebGL2 — `texture2DLodEXT` is already `#define`d to the core `textureLod()` built-in there — and which THREE.WebGLProgram's always-injected `luminance()` helper landed ahead of regardless of any CompileContext-level hoisting, since that prefix is assembled entirely outside shader-core's reach). `@triforge/shader-core` 0.4.2 shipped the fix (the line is simply deleted from `Bump.js`'s uv-offset `compileDefs()`). Verified the fix landed, then: Mercury/Venus/Mars surfaces swapped from the project-local `TextureBump` to stock `Bump({method:'uv-offset'})`; `TextureBump` class + its now-unused `ProcessNode`/`CompileContext`/`InputSocket` imports deleted from `CoreShaderNodes.ts`. Verified in-browser (headless Chromium): zero console/shader errors, real crater relief on Mercury. `CoreShaderNodes.ts` now contains zero raw GLSL — every export is a genuine node-graph sub-builder.
`WarpShaderNodes.ts`'s raw GLSL (the 16-layer × 3×3-cell starfield raymarch loop inside `WarpStarfield`) is **not** in the same category and will never retire — node graphs fundamentally cannot express loops (same limitation as Blender's shader editor), so that's a permanent, correctly-scoped exception, not tech debt.

**Warp "flash of landing page before warp plays" fixed** (fresh load + browser back/bfcache):
Root cause: `#ex-warp-veil` defaulted to `data-veil-state="hidden"` (opacity 0) in markup, only becoming opaque via `WarpRouter.init()` on `DOMContentLoaded` — which fires *after* the browser has already painted the raw page. Same root cause hit browser back-navigation: bfcache freezes the DOM exactly as it looked when the user left (veil already faded out), so the restored snapshot paints veil-transparent before `pageshow`'s `persisted` handler could re-cover it.
Fix (`WarpOverlay.astro` + `WarpRouter.ts`, following CSS Rule 23 / HTML H-09 / JT-11 exactly — markup declares default state, `main.css`'s existing state rules untouched, script only ever writes `.dataset.veilState`):
- Veil's default markup state changed `"hidden"` → `"instant-on"` (opaque) — covers the page from first paint, no JS dependency.
- Added a `pagehide` listener that forces the veil back to `instant-on` synchronously before the page is frozen into bfcache, so whatever snapshot gets cached is always already-covered.
- Veil now settles on the `"hidden"` terminal state after its fade-out transition ends (via `transitionend`), instead of resting indefinitely on the transient `"fading-out"` name.
- Named the previously-magic `220`ms hold as `WARP_VEIL_HOLD_MS` (JT-03).
Verified via headless Chromium: sampled `getComputedStyle(veil).opacity` immediately at navigation commit (before scripts settle) on both a fresh load of `/` and a real `goBack()` from `/sol` — both read `1` in both cases. Zero console errors.

**Landing page journal Mercury orb (`.lp-journal-orb`, Beat 06) gained crater bump relief:**
`CarouselPlanets.ts` builds every orb (`.lp-planet-orb`, `.lp-journal-orb`, `.lp-comm-orb`) as a plain `THREE.MeshStandardMaterial` with only `.map` set — no bump anywhere, for any planet (the small 120px carousel Mercury has the same gap; just invisible at that size). Since these are stock THREE materials (not triforge node graphs like the real Sol-scene planets), the fix is native THREE: reuse the colour texture as `bumpMap` + a tuned `bumpScale`, gated to Mercury only and only the journal-orb batch (`bump: true` on that one `_initCanvases` call; carousel and comm batches untouched). Value was tuned by visual iteration, not assumption — node-graph `Bump.strength` intuition (~0.05–0.15) does not transfer to THREE's stock `bumpMap`, which drives screen-space `dFdx`/`dFdy` on raw texture values: `0.04` was invisible, `2.0` produced high-frequency screen-space noise/grain, `0.5` was still slightly grainy. Landed on **`bumpScale: 0.22`** — clean crater rims and basins, no artifacts, confirmed via headless-browser screenshot at three iterations.

**Deferred (explicitly set aside by developer, not forgotten):** the landing page's `.lp-journal-orb` (Mercury) and `.lp-comm-orb` (Saturn) atmosphere Fresnel renders as a full ring around the entire silhouette (`buildCarouselAtmosphereMaterial()` in `CarouselPlanetMaterials.ts` is a pure view-angle Fresnel with zero light-direction awareness by design — confirmed via pixel-level sampling, not just visual read: at 120px carousel scale this is imperceptible, at 300–520px it clearly shows as a uniform ring rather than a one-sided glow). Fixing this requires *some* directional input into the formula (the scene's own `DirectionalLight`, or a fixed camera-space mask) — developer has not yet confirmed which approach is wanted, or whether "direction" refers to something else in the existing vector math. Do not attempt a fix without that confirmation; two different framings were already proposed and set aside this session.

---

## Phase 21 — Venus "Explore" scroll rebuilt onto the Mercury pattern + reusable coverflow (2026-07-10)

**Venus migrated from the pre-Phase-20 pattern to Mercury's**: circular-orbit `PlanetScrollCamera` path, dual-role progress strip, single bottom slide-up article panel — same architecture as Mercury, own gold/orange palette, own content. New files: `VenusProgressStrip.ts`, `VenusIntroCounters.ts` (direct clones of Mercury's, retargeted selectors/events). Old two-sided `#ex-venus-sidebar-left/right` offcanvas pair removed from `ContentOverlay.astro`.

**`VENUS_SCROLL_PATH` in `PlanetScrollCameras.ts` is a placeholder** — every waypoint this session used the same derived circular-orbit formula as Mercury's (`R = 5 − 3.2·sin(πt)`, angle `= 360·t`, lookAt shift `0.6·sin(πt)` along camera-right), recomputed twice as the section count grew (8 → 9 sections). The developer explicitly said to ignore camera framing quality throughout ("we will edit later") — **this is the named next-session task.**

**New reusable widget: `src/scripts/ui/shared/CoverflowSwiper.ts`** — first parameterized Swiper factory in the codebase (every prior carousel — `LandingJournal`, `RepoCarousel`, `CommCarousel` — hardcodes its own `new Swiper(...)`). `createCoverflowSwiper(options)` returns a live `Swiper` instance. Two effect modes:
- Stock Swiper `effect: 'coverflow'` (rotate/depth/stretch/modifier params) for simple cases.
- **`arcCurve`** — a hand-authored, piecewise-linear per-offset transform table (x/z/rotate, optionally `opacity`) that fully replaces Swiper's built-in formula, for tuned non-linear fans the stock continuous formula can't reproduce. Interpolated against Swiper's own `slide.progress` (note: positive progress = left of active, negative = right — inverted from the intuitive reading, documented inline).
- **`gapCurve`** — signed (not mirrored) per-offset `margin-right` override, for asymmetric spacing tapers.
- **`visibleRange: {left, right}`** — hides slides beyond N positions on each side via `visibility:hidden` rather than relying on container clipping/CSS masks (both proved unreliable against 3D-transformed slides — see bugs below).

**Two real bugs found and fixed in the factory** (both apply to any future `arcCurve` consumer, not just Venus):
1. Swiper's own `breakpoint` event can fire while the container is still `display:none` (every planet's overlay content sits in the DOM simultaneously; only the active one is visible), computing `NaN` for `swiper.translate` — invalid CSS, silently dropped, and Swiper's internal state stays corrupted afterward (doesn't self-heal on a later valid call). Fixed with a `container.clientWidth === 0` guard before any resync, backstopped by a `ResizeObserver` for the eventual hidden→visible transition.
2. `update()`'s internal `slideTo()` short-circuits (never emits `setTranslate`) once the active index stops changing, so the effect module's per-slide transform never runs from `update()` alone — fixed by explicitly re-emitting `setTranslate` after `update()`.

**Venus content structure — 9 sections now:**
1. Intro (typography-only, no card chrome, left-aligned, matches a dev-tools-referenced mockup)
2. **Coverflow** — all 7 projects (5 real + 2 filler: Vesper, Halo) in a 3D fan, hand-tuned `arcCurve`/`gapCurve` (values reverse-engineered from live devtools edits the developer made directly), `loop: true` (continuous wrap, verified both directions), `visibleRange: {left:3, right:2}` to clear the fixed progress strip
3–7. **Full centered/left-aligned project-detail cards** (`data-layout="project"`) — no section background (transparent, scene shows through directly — card background was tried and explicitly rejected), title/subtitle/description, 3 count-up numeric stats (reuses `VenusIntroCounters`'/Mercury's exact counter pattern — just add `.ex-venus-counter` + `data-count-to`/`data-count-suffix`), two CTAs (external "VISIT PROJECT" redirect + "VIEW DETAILS" opening the bottom article panel). **Section 3 (Lumen) stays centered** as the one intentional exception; sections 4–7 are left-aligned via a `data-align="left"` modifier.
8. Navigate, 9. Contact — unchanged from earlier this session.

**Article/off-canvas panel made always-opaque** (`.ex-venus-article-panel` — removed the `@media (min-width:1200px) { --st-bg: transparent }` immersive override inherited from Mercury's panel). Mercury's sections never overlapped the panel's own screen space, but Venus's new full-centered project cards do, and a transparent panel let the section behind it bleed through and visually collide with the panel's own header. Developer confirmed: off-canvas should always carry a background; sections should not.

**Offcanvas audit (developer asked, not yet acted on):** `@strata-packages/offcanvas` is used everywhere it should be. The only non-package show/hide logic left in the codebase is `RepoCarousel.ts`'s in-card accordion expand (toggles `aria-hidden` on sub-elements within a Swiper slide) — a different UI pattern (in-place expand, not a slide-in panel), not a clear migration candidate. `@strata-packages/modal` remains installed and unused. Developer's call on both, no action taken.

---

## Phase 22 — Explore pattern replicated to Sun, Earth, Mars, Jupiter, Saturn, Uranus, Neptune ✅ (2026-07-12)

**All 7 remaining planets migrated onto the Mercury/Venus "Explore" pattern** established in Phases 20–21: continuous circular-orbit `PlanetScrollCamera` path (radius scaled per-planet to that planet's actual sphere size — e.g. Sun R14→R6, Mercury/Venus-scale rocky planets R~2.5→R~1, Jupiter/Saturn R6.5→R2.7–3.5), a dual-role left progress strip (sections ↔ article paragraphs), and a single bottom slide-up article panel replacing the old Phase-13 two-sided offcanvas sidebar pairs. Each planet keeps its own palette, its own visual flavour (Mars's thicker dramatic borders, Saturn's thin elegant rules, Uranus's narrow cold panels, Jupiter's wider imperial padding), and its own contextual (dummy) content — no shared/generic copy.

**New files, one set per planet** (all direct structural clones of `VenusProgressStrip.ts`, retargeted selectors/events):
`SunProgressStrip.ts`, `EarthProgressStrip.ts`, `MarsProgressStrip.ts`, `JupiterProgressStrip.ts`, `SaturnProgressStrip.ts`, `UranusProgressStrip.ts` — all in `src/scripts/ui/solar-system/`.

**Neptune is the one exception to the pattern** — it's a short 5-section contact page with no detail/article content, so `NeptuneProgressStrip.ts` is sections-only (no article-mode toggle, no bottom panel). Its `NEPTUNE_SCROLL_PATH` also only has 5 waypoints (t-step 1/5) instead of the 8-waypoint (t-step 1/8) pattern every other planet uses.

**`variables.css`** — added the missing `--ex-color-{planet}-border-inner` / `-pill-bg` tokens for every planet that lacked them (previously only Mercury/Venus had them; the CSS pattern from Phase 20/21 needs both).

**`ContentOverlay.astro`** — all 7 old two-sided sidebar blocks (`#ex-{planet}-sidebar-left/right`) replaced with single `#ex-{planet}-article-panel` bottom offcanvas blocks; 7 new progress-strip `<nav>` blocks added as top-level siblings of `#ex-content-overlay` (same containing-block reasoning as Mercury/Venus's).

**Git note:** this phase was committed and pushed to `dev`, then merged directly into `main` via PR #3 — **skipping `test`/`beta`**, which violates `git-standards.md` RULE G-02 (no branch may be skipped). Not caught before the merge happened; `test` and `beta` were fast-forwarded to match `main` after the fact to resync the ladder. Watch for this on future merges — confirm the PR target branch before merging, not after.

---

## Phase 23 — Pre-release production-readiness audit + fixes (2026-07-12)

Full audit of the live site (navigation, responsive at 8 breakpoints, console/network via a real Playwright/Chromium pass, accessibility, SEO, forms, asset paths, content) framed as a hiring-manager review — see the audit conversation for the full report format. Real bugs found were fixed; cosmetic/deferred items were reported only. All fixes verified in a real browser (Playwright) with a clean console and zero horizontal-overflow at 320/375/425/768/1024/1280/1440/1920px afterward.

**Critical bug found and fixed — `/neptune` horizontal scroll bug, present at every breakpoint:**
Root cause was **`src/pages/neptune.astro` never importing `strata.css`** — every other page/layout does (`import '../styles/strata.css';` in frontmatter), which is what triggers Vite's Strata-CSS plugin to scan that page's component tree and generate its utility classes into the bundled CSS. Without it, none of `LandingHeader`'s/`LandingFooter`'s Strata utility classes (`w-100`, `d-flex`, etc.) were ever generated for this page — the footer background image (`footer.png`, 1536×1024 intrinsic) rendered at full natural size instead of being clipped/covered, blowing out the layout to 1536px wide regardless of viewport. Fixed by adding the missing import, plus two stylesheet `<link>` tags (`landing-header.css`, `landing-footer.css`) that were also silently missing from this page only.

**Second, independent horizontal-scroll cause on the same page:** `.ex-ct-footer-text` (`public/css/contact.css`) had `white-space: nowrap` applied to what is a full sentence, not the short label the rule was written for — forced the whole "Signal destination: Neptune, 8th planet…" line onto one row, overflowing at 320–375px. Removed the `nowrap`, added `text-align: center`.

**Third cause:** `contact.css` had **zero media queries** — `.ex-ct-layout` (two-column grid, first column pinned to `--ex-size-380`) and `.ex-ct-form-row` (name/email side-by-side) never collapsed below tablet width. Added one `@media (max-width: 767.98px)` block collapsing both to a single column — matches the `767.98px` breakpoint convention already used everywhere else in the project.

**Other `/neptune`-specific bugs fixed:**
- `<link rel="stylesheet" href="/webfonts/font-awesome.css" />` pointed at a file that has never existed (confirmed 404) — every icon on the page was invisible. Replaced with the same `import '@fortawesome/fontawesome-free/css/all.min.css';` every other layout uses.
- Social links (GitHub/LinkedIn/X) used literal `https://github.com/placeholder`-style dead URLs on both the standalone `/neptune` page **and** the `/sol?target=neptune` 3D-overlay version (`NeptuneOverlay.astro`), even though the real URLs (`AftabIbrahimKazi`, `aftab-kazi-715b88193`) already existed correctly in `LandingFooter.astro`. Both fixed to match; the Dribbble entry was removed (no real profile exists anywhere in the codebase to substitute a dead placeholder for).
- `og:image` defaulted to `/images/og-default.jpg` (404, never existed) in both `Landing.astro` and `Main.astro` — social-share previews would render broken. Repointed to the existing `/images/footer.png`. Added missing `twitter:card`/`twitter:title`/`twitter:description`/`twitter:image` tags (none existed anywhere) and explicit `<link rel="icon">` tags to both main layouts plus `neptune.astro` (favicon files existed in `public/` but were never linked from the two layouts actually in use — only from the unused `src/layouts/Layout.astro`, an Astro-starter leftover, dead code, not imported anywhere).
- Added `public/robots.txt` (`Allow: /`) — previously missing entirely. Sitemap generation was **not** added — requires a new `@astrojs/sitemap` dependency, out of scope for a bug-fix pass.

**Dead forms wired to a `mailto:` fallback (static GitHub Pages has no backend to submit to):**
Three forms were fully non-functional (`onsubmit="return false;"`, `action` pointing at routes that don't exist): the Neptune contact form (both the standalone page and the 3D-overlay version), Venus's "GET IN TOUCH" email-capture form, and Mercury's newsletter "SUBSCRIBE" form. All three now: use native HTML5 `required`/`reportValidity()` validation (blocks empty submission, verified in-browser), then build a `mailto:hello@aftabkazi.com` link pre-filled with subject + body from the form fields and hand off via `window.location.href`, plus a `role="status" aria-live="polite"` note telling the visitor what happened and giving the direct email as a fallback. This is the only submission path a static site without a form-service integration can offer — intentionally not wiring a third-party service (Formspree etc.), since that would be a new integration, not a bug fix.

**Other reported-but-deliberately-not-fixed findings** (need a product decision, not a code fix):
- Two separate "Contact" experiences exist — the header/footer nav "CONTACT" link goes to the standalone `/neptune` page; the landing carousel routes to `/sol?target=neptune` (the 3D overlay). Both work and both are now bug-free, but they're duplicate content with separately-maintained copy. Not consolidated — that's a call for the developer, not something to do unilaterally.
- Venus's 5 "VISIT PROJECT" buttons: `demoUrl` is `null` for every project (real project data still pending, see Next Up), so instead of leaving them as dead `href="#" target="_blank"` links, they now conditionally render as a visibly disabled `aria-disabled` state (non-focusable, dimmed) until real URLs are added.

**Content pass — every remaining bracket placeholder and meta-instructional sentence replaced** across `SunOverlay.astro`, `EarthOverlay.astro`, `MarsOverlay.astro`, `JupiterOverlay.astro`, `SaturnOverlay.astro`, `UranusOverlay.astro` (Venus/Mercury/Neptune were already real-shaped from earlier phases). All content is still explicitly dummy/example, consistent with the project's established pattern (Venus's Vesper/Lumen/Solstice, Mercury's real blog posts) — not final copy, but nothing reads as literally unfinished (`[Client / Project]`, "Placeholder — update with...") anymore:
- **Earth:** 3 named projects (Meridian — SaaS analytics dashboard, Northwind — Astro/Node e-commerce rebuild, Pulsegrid — Three.js IoT data visualisation) + an Open Source section correctly pointing to the two **real** public repos (Strata, Triforge) instead of a fake placeholder handle.
- **Jupiter:** 3 enterprise engagements framed as NDA-anonymized clients ("National Retail Chain", "Fintech Trading Platform", "Multi-Tenant SaaS Platform") — deliberately not given fake company names, matching how real enterprise portfolios represent NDA'd work, and consistent with the client-work descriptions already on the landing page's "Built under NDA" carousel (checkout rebuild / trading dashboard / admin portal — same three, cross-referenced).
- **Saturn:** 3 named digital products (Orbit UI — Figma kit, Nightfall — Astro theme, Glyphset — icon pack).
- **Mars:** 4 named lab experiments (Terrarium, Echograph, Fracture, Driftwood).
- **Uranus:** 4 named speculative concepts (Aftertouch, Palimpsest, Weathervane, Nocturne).
- **Sun:** bio/background/highlights paragraphs filled in with concrete (still example) numbers and a short origin story, replacing bracket fields and self-referential "update this with your actual X" sentences in the About-panel item bodies.

**Not yet committed** — all Phase 23 changes are uncommitted on `dev` as of this update. Follow `git-standards.md` RULE G-02 exactly this time: `dev → test → beta → main` in sequence, do not repeat the Phase 22 PR-target mistake.

---

## Phase 24 — Landing section viewport-fit pass (2026-07-12)

Every landing beat now fits the viewport with zero vertical overflow, verified via Playwright `scrollHeight` vs `innerHeight` measurement at 1920×1080, 1440×900, 1280×720, 1024×768, 768×1024, 375×667. Root problem: Beat 05 (Commercial Work) stacked to ~1151px minimum — taller than even 1080p — and beats 01/02/04/06 overflowed on short/narrow screens.

**Base compaction (index.astro strata classes):** `.lp-comm` gap xl→lg, all 4 `.lp-comm-slide` cards gap lg→md + padding xl→lg, metrics bar `pt` xl→md.

**`landing-comm.css`:** `.lp-section.lp-section--comm` vertical padding xxxl→lg (top-half rule). **First height-based media queries in the project** (flagged: breakpoint convention was width-only): `(max-height: 949.98px) and (min-width: 992px)` shrinks heading xxl→xl and stage/orb 520→420; `(max-height: 799.98px)` hides the Key-metrics bar, drops section padding to md, compacts slide gap/padding + title clamp. Developer chose this "height-adaptive" approach (hide/shrink on short screens) over compact-only or scale-down.

**Width tiers reworked (same file):** MD tablets — stage/orb → 180px, metrics bar hidden, and the thumbnail rail switched `position: static` + horizontal row (`.lp-comm-rail`/`.lp-comm-thumbs` flex-direction row). Key finding: the rail is ~400px of absolutely-positioned content inside the stage, so shrinking the stage alone *increases* section overflow — the rail must go static/horizontal when the stage shrinks. SM — stage 180, metrics hidden. XS — stage + per-slide stats + metrics all hidden, gaps tightened to sm.

**`landing.css` XS block (was empty):** `.lp-section` padding xxxl→xl vertical, `.lp-heading` xxl→xl, `.lp-heading--hero` xxxl→xxl on phones. **`landing-story.css` XS:** `.lp-about` gap→sm, `.lp-skills` gap→md. **`landing-work.css`:** `(max-height: 799.98px)` drops `.lp-section--work` padding to md (Beat 04 was +43px at 1280×720).

Visually verified via screenshots at 4 viewports — tablet renders the Saturn orb with the rail as a horizontal row beside it; phone hides the orb entirely. Uncommitted on `dev`, same boat as Phase 23.

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

### Commit + push Phase 23 (immediate next step)

Everything in Phase 23 above is uncommitted on `dev`. Follow `git-standards.md` RULE G-02 exactly: `dev → test → beta → main` in sequence — **do not repeat the Phase 22 mistake** of merging a PR directly from `dev` into `main` and skipping `test`/`beta`.

### Camera waypoints — every planet still uses a generic derived formula, none hand-tuned

`PlanetScrollCameras.ts` gives all 9 planets a continuous circular-orbit path with radius breathing scaled to each planet's actual sphere size, but **no planet's `lookAt` framing has been hand-tuned to what its individual sections actually show** — Mercury is the only one with real per-waypoint framing work done (Phase 20). Venus, Sun, Earth, Mars, Jupiter, Saturn, and Uranus all need the same kind of session Mercury got: real per-section framing tuned to what each waypoint's section actually displays, not a mechanically-derived circle. Do this per-planet before further content changes on that planet, since re-tuning waypoints may shift section pacing/count.

### Real content still needed

Sun, Earth, Mars, Jupiter, Saturn, and Uranus now have concrete example content (Phase 23) instead of bracket placeholders — but it is still example/dummy content, not final real copy. Still outstanding:

**Venus (Design):** still needs real project data — `image` is `null` on every project (renders a placeholder icon) and `demoUrl` is `null` on every project (the 5 "VISIT PROJECT" buttons now render as a visibly disabled state rather than dead links, per Phase 23, but still need real URLs to become live)
**Mercury (Journal):** real article images (currently 5 shared SVG placeholders in `public/images/articles/`, reused across all 7 posts)
**All planets:** the example content added in Phase 23 (Meridian/Northwind/Pulsegrid, the NDA-anonymized Jupiter clients, Orbit UI/Nightfall/Glyphset, Terrarium/Echograph/Fracture/Driftwood, Aftertouch/Palimpsest/Weathervane/Nocturne) is realistic-sounding placeholder, not real project history — swap for actual work when ready
**Landing page:** Beat 01–04 placeholder text (hero heading, stats, work pills) not yet audited for remaining placeholders

**Also needed:**
- Sidebar `items[]` arrays in each `{Planet}Overlay.astro` to match real content once written
- Two duplicate "Contact" experiences (`/neptune` static page vs. `/sol?target=neptune` 3D overlay) — both now bug-free (Phase 23) but still separately-maintained duplicate copy; consolidating is a product decision, not done

**Deferred but not forgotten:**
- `@strata-packages/modal` — installed, not yet wired
- Create journal/blog pages for Venus → Neptune (matching `/mercury` pattern)
- `@triforge/compositor-core` post-processing (bloom, vignette, film grain)
- `destroy()` methods on all engines + `astro:before-swap` cleanup
- Section-by-section strata utility audit (landing page beats)
- Asteroid belt page / section
- Sitemap generation (`@astrojs/sitemap` or equivalent) — flagged in the Phase 23 audit, not added since it requires a new dependency
- **`Bump({method:'uv-offset'})` upstream bug still open** — report the 0.4.1 re-test findings (extension directive still misordered, now preceded by a `luminance()` helper) back to the triforge repo. Once genuinely fixed, migrate Mercury/Venus/Mars off `TextureBump` and delete it from `CoreShaderNodes.ts` — third and last custom node to retire.
- **`Bump({method:'uv-offset'})` upstream bug still open** — report the 0.4.1 re-test findings (extension directive still misordered, now preceded by a `luminance()` helper) back to the triforge repo. Once genuinely fixed, migrate Mercury/Venus/Mars off `TextureBump` and delete it from `CoreShaderNodes.ts` — third and last custom node to retire.
