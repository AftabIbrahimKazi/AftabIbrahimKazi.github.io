Symptom: raw landing page flashed briefly before the warp transition played, on fresh load and on browser back-navigation.

**Root cause:** `#ex-warp-veil` defaulted to `data-veil-state="hidden"` in markup, only becoming opaque via `WarpRouter.init()` on `DOMContentLoaded` — which fires after the browser has already painted. Browser back-navigation hit the same root cause via bfcache: the frozen DOM snapshot already had the veil faded out from when the user left.
**Fix:** Veil's default markup state changed to `"instant-on"` (opaque from first paint, no JS dependency). Added a `pagehide` listener forcing the veil back to `instant-on` before the page freezes into bfcache. Veil settles on `"hidden"` only after its fade-out `transitionend`.
**How to spot again:** Any bfcache-restore visual glitch — check whether the affected element's default markup state assumes JS has already run, since bfcache restores whatever the DOM looked like at `pagehide`.
