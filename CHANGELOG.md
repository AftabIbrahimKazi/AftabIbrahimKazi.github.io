# Changelog

All notable changes to this project are documented here, per `coding-standards/versioning-standards.md`.

---

## [0.1.0] — 2026-07-09

### Added
- Replaced the 4 placeholder Mercury journal articles with 7 real, recruiter-facing blog posts: Strata deep-dive, Triforge deep-dive, why the two tools were built, this site as proof-of-dogfooding, the ghost-planet-bug postmortem, the warp router architecture writeup, and package-maintenance lessons.
- `MercuryIntroCounters.ts` — IntersectionObserver-driven count-up animation for the Mercury intro section's stat pills.
- `?article=<id>` deep-link support on `/sol?target=mercury`, auto-opening the matching article panel.
- `--ex-scroll-headroom-sm`/`-lg` tokens plus scroll-container padding fixing a bug where the last Mercury section/paragraph could never reach its `scrollIntoView` target, which read as the scroll abruptly ending.
- Real per-paragraph topic labels on the article progress-strip pagination (previously all read "Read").
- Landing page Beat 06 journal carousel expanded from 5 hardcoded cards to 7, each deep-linking to its matching Mercury article.

### Changed
- Reordered Mercury's 10 scroll sections: removed the obsolete Topics/Approach/Archive sections, moved Subscribe (newsletter) to the true final position instead of second-to-last, and centered + restyled the Subscribe section (merged input/button into one pill, added an icon accent).
- Progress-strip section labels in `ContentOverlay.astro` updated to match the new section order.

### Fixed
- Corrupted UTF-8 mojibake (`â€¢`, `â€”`, `â”€â”€`) in `src/pages/index.astro`, restored to proper `•`, `—`, `──` characters.

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
