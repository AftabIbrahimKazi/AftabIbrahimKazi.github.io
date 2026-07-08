# Changelog

All notable changes to this project are documented here, per `coding-standards/versioning-standards.md`.

---

## [0.0.2] — 2026-07-08

### Fixed
- Retired `TextureBump`, the last custom raw-GLSL node in `CoreShaderNodes.ts` — `@triforge/shader-core` 0.4.2 fixed the upstream `Bump({method:'uv-offset'})` extension-ordering bug it existed to work around. Mercury, Venus, and Mars surfaces now use the stock `Bump` node.
- Fixed a flash of the raw landing page before the warp transition covers it, on both fresh page load and browser back-navigation (bfcache). The warp veil now defaults to opaque via CSS/markup state instead of waiting on JS to run.
- Added crater bump relief to the landing page's journal Mercury orb (`.lp-journal-orb`), which previously rendered flat.

### Changed
- Upgraded `@triforge/shader-core` 0.4.1 → 0.4.2.

---

## [0.0.1] — 2026-06-21

Initial release — Exo Space Planetarium portfolio site (Astro 6 MPA, Three.js solar system, warp-speed page transitions, Navagraha planet theming).
