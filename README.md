# Exo Space Planetarium

A portfolio site built as an explorable solar system — and a live demonstration of my own open-source tools. The planets are rendered by [triforge](https://github.com/AftabIbrahimKazi/triforge), my Blender-inspired node system for Three.js. The styling layer is [strata](https://github.com/AftabIbrahimKazi/strata), my CSS utility framework. The site doesn't just present my work; it runs on it.

## How it works

The landing page opens on a procedural nebula with a planet carousel. Picking a planet fires a warp-speed transition — a custom star-field shader, colour-keyed to the destination — and lands on a full Three.js solar system where each planet carries a category of work, framed around the Hindu Navagraha.

- **Every planet material is a triforge node graph.** Sun, all eight planets, the carousel minis, and the warp shader itself are composed from shader-core nodes (PrincipledBSDF, terminator bands, fresnel atmospheres, texture bump, ACES tone mapping) instead of hand-written GLSL. The few genuinely loop-based effects live in custom nodes — the same escape hatch Blender's OSL Script node provides.
- **Planet motion runs on @triforge/keyframe**, the asteroid belt on @triforge/geometry-nodes.
- **Multi-page, no SPA.** Astro 6 MPA with a fullscreen warp overlay bridging real page navigations.

## Stack

| Layer | Tool |
|---|---|
| Framework | Astro 6 (MPA, SSG) |
| 3D | Three.js |
| Shader system | @triforge/shader-core (own library) |
| Animation | @triforge/keyframe (own library), GSAP (camera) |
| CSS | strata-css (own framework) + design-token layer |
| UI packages | @strata-packages/offcanvas, @strata-packages/modal |

## Structure

```
src/
├── pages/              Astro routes (landing, sol system, planet pages)
├── layouts/            Landing + planet-page layouts
├── components/         Warp overlay, chrome, per-planet content overlays
└── scripts/
    ├── *-entry.ts      Bootstrap-only entries (one per domain)
    ├── core/           Engine + orchestrator per domain
    ├── shader-nodes/   Shared custom triforge nodes
    ├── objects/        Scene objects (folder per planet)
    ├── animations/     Render loops + per-planet animation
    ├── controllers/    Camera + interaction
    ├── ui/             Carousel, overlays, dot-nav, journal
    └── warp/           Site-wide warp transition subsystem
```

The project is built against a layered coding-standards system (see `coding-standards/`) covering CSS tokens, HTML, TS architecture, accessibility, SEO, and QA — enforced on every change.

## Running locally

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static build to ./dist
```

## Credits

- Planet and star textures: [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0)
- Mythological framing: the Navagraha of Hindu astronomy

## License

**All rights reserved.** This repository is public for portfolio review only — the code, design, and content may not be copied, reused, or resold. See [LICENSE](LICENSE) for the exact terms. The open-source libraries it depends on remain under their own licenses.

---

© 2026 Aftab Ibrahim Kazi · [GitHub](https://github.com/AftabIbrahimKazi) · [LinkedIn](https://www.linkedin.com/in/aftab-kazi-715b88193)
