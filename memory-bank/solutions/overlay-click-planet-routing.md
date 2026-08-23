Symptom: clicking any planet's overlay trigger button opened Saturn's sidebar content, regardless of which planet's page/section was clicked.

**Root cause:** All 7 planet overlay scripts each registered `document.addEventListener('click', ...)`, guarded by `btn.closest('.ex-{planet}-section')` DOM traversal — unreliable once all planet sections exist in the DOM simultaneously (Astro's script bundling made the guard ambiguous; last-registered listener effectively won).
**Fix:** Every trigger button carries an explicit `data-planet="{planet}"` attribute; the guard became `btn.dataset.planet !== '{planet}'` — no DOM traversal, no ambiguity.
**How to spot again:** Any "wrong content shows for a click" bug where multiple near-identical sibling components each register their own global document listener — check for explicit per-instance attribute routing before assuming it's a data/state bug.
