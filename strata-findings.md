# Strata CSS — Findings

> Entries marked **[BUG]** are confirmed defects with a clear fix. Entries marked **[LIMITATION]** are missing features. Entries marked **[BEHAVIOUR]** are undocumented but technically correct cascade outcomes worth knowing.

---

Bugs, limitations, and unexpected behaviours discovered while using strata-css in this project.

---

## 1. [BUG — RESOLVED in 1.3.0] `rounded-pill` is silently overridden by any `btn-*` or `btn-outline-*` class

**Severity:** High — the override is total and silent. No warning, no visual hint. The developer has no indication `rounded-pill` has been discarded.

**Symptom:**

Both orderings of the class list fail identically:

```html
<!-- rounded-pill listed after btn-outline-primary — no effect -->
<a class="lp-footer-btn btn-outline-primary rounded-pill">START THE JOURNEY</a>

<!-- rounded-pill listed before btn-outline-primary — still no effect -->
<a class="lp-footer-btn rounded-pill btn-outline-primary">START THE JOURNEY</a>
```

In both cases the element renders with `border-radius: var(--st-border-radius)` (the strata component default, typically `10px`) instead of the expected `border-radius: 999px` (pill shape). This is a critical diagnostic signal: **HTML class order is irrelevant to CSS cascade resolution**. The browser does not read class attributes left-to-right when computing styles. It applies all matched rules and resolves conflicts purely by cascade layer, then specificity, then source order within the stylesheet — not by the order classes appear on the element. A developer who moves `rounded-pill` before `btn-outline-primary` in the HTML, sees no change, and concludes the class is broken entirely is responding correctly — it is broken, but for a reason invisible at the HTML level.

**Root cause — layer registration mismatch:**

Both `rounded-pill` and `btn-outline-primary` (and every `btn-*` variant) are registered in the `'components'` layer inside `registry.js`:

```js
// registry.js line 631
reg('rounded-pill', 'components', `.rounded-pill { border-radius: 999px; }`)

// registry.js line 714 (inside BTN_COLORS.forEach)
reg(`btn-outline-${color}`, 'components', `.btn-outline-${color} {
  ...
  border-radius: var(--st-border-radius);   // ← conflict
  ...
}`)
```

Because both rules land in `@layer st-components-*`, the CSS cascade resolves the `border-radius` conflict by **source order within the layer** — the later rule wins. `btn-outline-primary` is generated at line 714, which is after `rounded-pill` at line 631. The generator emits btn rules after rounded rules into the same layer block. Therefore `.btn-outline-primary { border-radius: var(--st-border-radius) }` always wins over `.rounded-pill { border-radius: 999px }` regardless of class order in the HTML.

Contrast this with how the utilities layer works: `@layer st-utilities-*` is declared after `@layer st-components-*` in the final stylesheet, so any class in the utilities layer beats any class in the components layer unconditionally. If `rounded-pill` were in utilities, it would override the btn's border-radius automatically.

**Why `rounded-pill` is in the wrong layer:**

`rounded-pill` is a purely presentational modifier — it describes the shape of any element, independent of what that element is. It carries no semantic meaning about component structure. This is the definition of a utility class. Bootstrap itself categorises `rounded-pill` under utilities, not components. Registering it in `'components'` means it can be silently defeated by any component class that also touches `border-radius`, including all `btn-*`, `btn-outline-*`, `card`, `badge`, and `input-group` variants.

**Affected classes (same root cause):**

The entire `rounded-*` family is registered in `'components'`:
- `rounded`, `rounded-0` through `rounded-5`, `rounded-circle`, `rounded-pill`
- `rounded-top`, `rounded-end`, `rounded-bottom`, `rounded-start`
- Responsive variants `rounded-{bp}-{n}`

All of them can be silently defeated by any component registered after them that sets `border-radius`.

**Fix (strata repo):**

Change the layer argument from `'components'` to `'utilities'` for the entire `rounded-*` family:

```js
// Before
reg('rounded-pill', 'components', `.rounded-pill { border-radius: 999px; }`)
reg('rounded-circle', 'components', `.rounded-circle { border-radius: 50%; }`)
reg('rounded-0', 'components', `.rounded-0 { border-radius: 0; }`)
// ... all rounded variants

// After
reg('rounded-pill', 'utilities', `.rounded-pill { border-radius: 999px; }`)
reg('rounded-circle', 'utilities', `.rounded-circle { border-radius: 50%; }`)
reg('rounded-0', 'utilities', `.rounded-0 { border-radius: 0; }`)
// ... all rounded variants
```

Moving to `'utilities'` places these rules in `@layer st-utilities-*`, which is declared after `@layer st-components-*`. This guarantees that `rounded-pill` beats `btn-outline-primary`'s border-radius regardless of registration order, which is the behaviour any developer would intuitively expect when writing `class="btn-outline-primary rounded-pill"`.

**Confirmed in registry.js:**
- `rounded-pill` → line 631, layer `'components'`
- `rounded-circle` → line 2810, layer `'utilities'` ← **inconsistent** — `rounded-circle` is already in utilities but `rounded-pill` is not
- `rounded-0` through `rounded-5` → lines 2804–2809, layer `'utilities'` ← **also already utilities**
- `rounded` (default radius) → line 2803, layer `'utilities'`

This reveals that the `rounded-*` scale and `rounded-circle` were correctly placed in utilities but `rounded-pill` was missed and left in components. It is an isolated registration error, not a systemic design decision.

**Workaround (consumer):**

Until fixed in the strata repo, override in unlayered custom CSS, which sits above all layers:

```css
.lp-footer-btn.rounded-pill {
  border-radius: 999px;
}
```

Or use an inline style as a last resort. Do not rely on `rounded-pill` having any effect on any element that also carries a `btn-*` class.

---

## 2. [LIMITATION — RESOLVED in 1.3.0] `gap` has no arbitrary value support

**Expected:** `gap-[var(--ex-space-xl)]` → `gap: var(--ex-space-xl)`
**Actual:** Class not recognised — no output generated.

Strata implements arbitrary value support for `margin` and `padding` via `m-[...]` / `p-[...]` patterns — e.g. `p-[var(--ex-space-xl)]` generates `padding: var(--ex-space-xl)`. The `gap` utility has no equivalent. The `ARBITRARY_PATTERNS` array in `registry.js` covers spacing (margin/padding), width, height, text, bg, border, shadow, z-index, transition, opacity, and cursor — but `gap` is entirely absent.

The named `gap-0` through `gap-5` scale uses Bootstrap rem values, making it incompatible with project `--ex-space-*` tokens. Without arbitrary support, there is no way to express a token-based gap value through a utility class.

**Fix (strata repo):**

Add a `gap` entry to `ARBITRARY_PATTERNS` matching the same pattern as `m-[...]` and `p-[...]`:

```js
{ re: /^(!?)gap-\[(.+)\]$/, fn: (m) => {
  const i = m[1] ? ' !important' : '';
  return { layer: 'utilities', css: `.${escapeClass(m[0])} { gap: ${m[2]}${i}; }` }
}}
```

This would enable `gap-[var(--ex-space-xl)]`, `gap-[12px]`, `gap-[1rem_2rem]` (with underscore-to-space replacement) consistently with the existing spacing arbitrary API.

**Workaround:** Keep `gap` declarations in custom CSS.

---

## 3. [BUG — RESOLVED in 1.3.0] `text-[var(...)]` with a CSS variable is always treated as `color`, never `font-size`

**Expected:** `text-[var(--ex-font-size-xxxs)]` → `font-size: var(--ex-font-size-xxxs)`
**Actual:** Generates `color: var(--ex-font-size-xxxs)` — the wrong property entirely, producing invalid CSS.

The `text-[...]` arbitrary handler uses a regex to decide which property to emit:

```js
const prop = /^[\d.]+(px|rem|em|%|vw|vh|ch|ex|pt|cm|mm)$/.test(val)
  ? 'font-size'
  : 'color'
```

The regex requires the value to **begin with a digit** and **end with a unit suffix**. A CSS variable reference (`var(--ex-font-size-xxxs)`) matches neither condition, so the handler always falls through to `color`.

This means `text-[...]` can only safely be used for font-size when the value is a bare literal (e.g. `text-[0.875rem]`, `text-[14px]`). Any token-based font-size must stay in custom CSS.

**Fix (strata repo):**

Separate font-size and color into distinct arbitrary prefixes to avoid the ambiguity entirely:

```js
// text-[...] → color only (no ambiguity)
{ re: /^(!?)text-\[(.+)\]$/, fn: (m) => {
  const i = m[1] ? ' !important' : ''
  return { layer: 'utilities', css: `.${escapeClass(m[0])} { color: ${m[2]}${i}; }` }
}},
// fs-[...] → font-size
{ re: /^(!?)fs-\[(.+)\]$/, fn: (m) => {
  const i = m[1] ? ' !important' : ''
  return { layer: 'utilities', css: `.${escapeClass(m[0])} { font-size: ${m[2]}${i}; }` }
}},
```

Alternatively, detect `var(` as an explicit opt-in for font-size via a dedicated prefix, or add a `font-size-[...]` / `fs-[...]` pattern alongside the existing `text-[...]`.

**Workaround:** Keep all token-based `font-size` declarations in custom CSS. Only use `text-[...]` for `font-size` when the value is a bare literal (e.g. `text-[0.875rem]`).

---

## 5. [BUG — RESOLVED in 1.3.0] `bg-[...]` arbitrary generates `background-color`, not `background`

**Expected:** `bg-[linear-gradient(...)]` → `background: linear-gradient(...)`
**Actual:** Generates `background-color: linear-gradient(...)` — invalid CSS, ignored by browser.

The arbitrary bg pattern in `registry.js`:
```js
{ re: /^(!?)bg-\[(.+)\]$/, fn: (m) => {
  return { layer: 'utilities', css: `.${escapeClass(m[0])} { background-color: ${m[2]}${i}; }` }
}}
```

Hardcoded to `background-color`. Gradients require the `background` shorthand.

**Workaround:** Keep gradient backgrounds in custom CSS.

---

## 6. [BUG — RESOLVED in 1.3.0] Spacing arbitrary (`p-[...]`, `m-[...]`) does not replace underscores with spaces

---

## 14. [BUG — RESOLVED in 1.3.1] `ps-[...]` and `ms-[...]` arbitrary classes are silently ignored

**Severity:** Medium — class is accepted by HTML with no error; no CSS is generated.

**Symptom:** `ps-[var(--ex-space-sm)]` produces no output. No padding-left applied.

**Root cause:** The arbitrary spacing regex at `registry.js` line 3139:
```js
{ re: /^(!?)(m[trblxye]?|p[trblxye]?)-\[(.+)\]$/, fn: (m) => {
```
The character class `[trblxye]` covers `t r b l x y e` but omits `s`. `SPACING_PROPS` at line 47 correctly defines `'ps': ['padding-left']` and `'ms': ['margin-left']`, but the regex never matches them so the handler is never called.

Note: `pe-[...]` works because `e` is in the character class. Only the `s` (start) variants are broken.

**Fix (strata repo):** Add `s` to both character classes:
```js
{ re: /^(!?)(m[trblxyes]?|p[trblxyes]?)-\[(.+)\]$/, fn: (m) => {
```

**Workaround:** Use `pl-[...]` / `ml-[...]` (padding-left / margin-left) instead of `ps-[...]` / `ms-[...]`.

**Expected:** `p-[10px_20px]` → `padding: 10px 20px`
**Actual:** `padding: 10px_20px` — literal underscores, invalid CSS.

Other arbitrary patterns (`border-[...]`, `shadow-[...]`, `transition-[...]`) correctly call `.replace(/_/g, ' ')`. The spacing handler does not.

**Workaround:** Use directional variants separately — `pt-[10px] px-[20px]` instead of a shorthand.

---

## 7. [BEHAVIOUR] `z-2` utility sets `z-index` only — does not set `position`

**Expected (assumed):** `z-2` makes an element stack correctly.
**Actual:** `z-2` generates only `z-index: 2`. `position` defaults to `static`, which ignores `z-index` entirely.

**Workaround:** Always pair `z-{n}` with a position utility — `position-relative z-2`, `position-absolute z-2`, etc.

---

## 8. [BEHAVIOUR] `card` component sets `position: relative` implicitly

The `card` component rule includes `position: relative`. Any element using the `card` class as a strata component that also needs a different `position` value must override it explicitly in unlayered CSS or via a higher-specificity utility.

Not a bug per se, but undocumented and unexpected.

---

## 9. [LIMITATION — RESOLVED in 1.4.0] No positional offset utilities or arbitrary classes

No `top-*`, `right-*`, `bottom-*`, `left-*`, or `inset` utilities exist — neither named scale variants nor arbitrary (`top-[var(...)]`, `right-[var(...)]`, etc.). The `ARBITRARY_PATTERNS` array has no entries for any offset property.

Strata does provide composite position utilities (`fixed-top`, `fixed-bottom`, `sticky-top`, `sticky-bottom`) but these bundle a hardcoded `z-index: var(--st-z-fixed)` or `var(--st-z-sticky)`. If your element needs a custom `z-index`, these classes are unusable — the bundled z-index overrides yours and cannot be detached without unlayered CSS.

`translate-middle`, `translate-middle-x`, and `translate-middle-y` are available for the common `translateX/Y(-50%)` centering pattern.

**Workaround:** Keep `top`, `right`, `bottom`, `left`, and `inset` declarations in custom CSS. For the `translateY(-50%)` vertical-centre pattern, use `translate-middle-y` instead of a custom CSS `transform`.

---

## 10. [LIMITATION — RESOLVED in 1.4.0] No `object-position` arbitrary or utility

`object-fit` is covered (`object-fit-cover`, etc.) but `object-position` has no equivalent.

**Workaround:** Keep `object-position` in custom CSS.

---

## 11. [LIMITATION] No `grid-template-columns` arbitrary or utility

Custom column definitions (e.g. `grid-template-columns: 260px 1fr`) cannot be expressed in strata at all. Only the 12-column `col-*` system is available.

**Workaround:** Keep `grid-template-columns` in custom CSS.

---

## 12. [LIMITATION — RESOLVED in 1.3.0] No `font-weight` arbitrary or utility

No `fw-[...]` pattern exists in `ARBITRARY_PATTERNS`. Named scale classes (`fw-light`, `fw-normal`, `fw-semibold`, `fw-bold`, `fw-bolder`) cover standard weights but cannot express custom token values like `var(--ex-heading-font-weight)` or `var(--ex-para-font-weight)`.

**Workaround:** Keep `font-weight` declarations in custom CSS.

---

## 13. [LIMITATION] No `font-style` utility (`fst-normal` / `fst-italic`)

Bootstrap provides `.fst-normal` and `.fst-italic`. Strata does not register these.

**Workaround:** Keep `font-style` declarations in custom CSS.

---

## 15. [BEHAVIOUR] `list-group-item` sets `display: block` in components layer

When pairing `list-group-item` with `d-flex` on the same element, the utility wins (utilities layer beats components layer) — but the intent is non-obvious and the component's block display is silently discarded.

Not a bug, but a cascade layering behaviour to be aware of when mixing component and utility classes.

---

## 17. [BUG — RESOLVED in 1.4.2] `escapeClass` does not escape `%` — arbitrary classes with percentage values produce invalid CSS selectors

**Severity:** High — the class is silently ignored. No CSS is generated. No error is thrown.

**Symptom:** `top-[50%]` generates `.top-\[50%\] { top: 50%; }` — the `%` is unescaped in the selector, making it invalid. The browser ignores the rule entirely.

**Root cause:** The `escapeClass` function (registry.js line 13) escapes `! [ ] / : . # ( ) ,` but omits `%`. In a CSS selector, `%` must be escaped as `\%` for the rule to be valid.

```js
function escapeClass(cls) {
  return cls
    .replace(/!/g,  '\\!')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    // ... no % handling
}
```

**Affected patterns:** Any arbitrary class whose value contains `%` — e.g. `top-[50%]`, `w-[33%]`, `h-[100%]`, `opacity-[0.5]` (no %, fine), `left-[10%]`.

Note: named classes like `w-100` / `h-100` are pre-built and bypass `escapeClass` — they are unaffected.

**Fix (strata repo):** Add `%` to the escape chain:
```js
.replace(/%/g, '\\%')
```

**Workaround:** Keep `%`-based values in custom CSS. Use token-based or fixed-unit arbitrary values where possible (`top-[var(--half)]`, `w-[200px]`).

**Project impact:** `top-[50%]` restored to `.lp-dot-nav` in HTML; `top: 50%` removed from CSS.

---

## 18. [LIMITATION — RESOLVED] `@strata-packages/modal` has no sidebar/drawer/offcanvas component

**Package:** `@strata-packages/modal` v1.0.0

**Missing feature:** A slide-in drawer panel anchored to a viewport edge (left, right, top, or bottom) — commonly called an offcanvas or sidebar component.

**What the package currently provides:** A centred dialog modal only. `.modal-dialog` is horizontally centred (`margin: auto`) and enters from above (`transform: translateY(-20px)`). There is no positional variant, no `translateX` slide, no edge-anchor concept, and no `data-st-side` attribute or equivalent.

**What is needed:** A drawer component that:
- Slides in from a configurable edge (`left` or `right` at minimum, `top`/`bottom` optionally)
- Uses a `data-st-side="left|right"` attribute to drive direction — consistent with the existing `data-st-*` attribute convention in the modal package
- Shares the same trigger/dismiss/backdrop/event API already established: `data-st-toggle="offcanvas"`, `data-st-dismiss="offcanvas"`, `data-st-backdrop="static"`, `st:offcanvas:open` / `st:offcanvas:close` events
- Exposes programmatic `open(el)` / `close()` so the caller can set `data-st-side` before calling `open()` — enabling dynamic direction (e.g. a card section on the left opens the drawer from the right)

**Why this matters:** Two surfaces in this project — `#ex-mercury-sidebar` (article preview panel) and `#ex-jn-sidebar` (journal blog card panel) — are edge-anchored drawers that had to be implemented as custom controllers (`JournalSidebarController.ts` + inline MercuryOverlay script) purely because no package equivalent exists. Both follow the same open/close/backdrop/Escape/focus pattern the modal already implements. An offcanvas component with the same API would replace both.

**Suggested package name:** `@strata-packages/offcanvas` (separate package, parallel to `@strata-packages/modal`) or a drawer variant added to the existing modal package under a `data-st-variant="drawer"` flag.

---

## 20. [BUG] Only `col-12` is registered — all other `col-*` variants produce no output

**Severity:** Critical — the 12-column grid system is effectively non-functional. Any layout relying on `col-1` through `col-11`, `col-auto`, or responsive variants (`col-sm-*`, `col-md-*`, `col-lg-*`, `col-xl-*`) produces no CSS. Elements fall back to full-width block display.

**Symptom:** `col-6` on two sibling divs inside a `.row` does not produce a two-column layout. Both divs render full-width, stacked vertically. Only `col-12` (full-width) works because it matches the default block behaviour and requires no column width rule to be visible.

**Root cause (likely):** The `col-*` scale in `registry.js` registers only `col-12` (or the registration loop that should generate `col-1` through `col-12` is incomplete / not firing for values 1–11). Responsive variants (`col-{bp}-{n}`, `col-{bp}-auto`) are either unregistered or registered in a layer that is overridden.

**Affected classes:** `col-1` through `col-11`, `col-auto`, `col-sm-*`, `col-md-*`, `col-lg-*`, `col-xl-*`, `col-xxl-*`.

**Workaround:** Avoid the `row` / `col-*` grid system entirely for non-full-width layouts. Use flexbox utilities (`d-flex`, `flex-grow-1`, `flex-shrink-0`, `flex-wrap`, `align-items-*`, `justify-content-*`) on semantic wrapper divs to achieve equivalent layouts.

---

## 19. [LIMITATION — RESOLVED in 1.4.5] No responsive prefix support on arbitrary `gap` values

**Expected:** `gap-sm-[var(--ex-space-xs)]` → `@media (min-width: 576px) { gap: var(--ex-space-xs); }`
**Actual:** Class not recognised — no output generated.

Strata has no arbitrary `gap` support at all (see finding #2). As a consequence, responsive arbitrary gap variants (`gap-sm-[...]`, `gap-lg-[...]`) are also unsupported. Named scale responsive variants for other utilities (`px-sm-3`, `mt-lg-2`) work correctly as pre-built classes, but `gap` has no named scale equivalents compatible with project `--ex-space-*` tokens.

**Workaround:** Keep responsive gap overrides in custom CSS using a `@media` rule.

---

## 16. [BUG — RESOLVED in 1.4.1] `fixed-top`, `fixed-bottom`, `sticky-top`, `sticky-bottom` bundle a hardcoded `z-index` that cannot be detached

**Severity:** Medium — the classes appear to work but silently impose a z-index you cannot override from the utilities layer.

**Symptom:** Adding `fixed-top` to an element that needs a custom `z-index` (e.g. `z-[20]`) produces the wrong stacking order. Because both rules land in `@layer st-utilities-*`, the last registered rule wins — and the `z-index` inside `fixed-top` is registered after `z-[20]`, so it always wins.

**Root cause:** Each composite positioning class bundles position + offsets + z-index into one rule:

```js
reg('fixed-top', 'utilities', `.fixed-top { position: fixed; top: 0; right: 0; left: 0; z-index: var(--st-z-fixed, 1030); }`)
```

There is no way to detach the `z-index` — applying a separate `z-[n]` utility on the same element will be overridden if `fixed-top` is registered later in the same layer.

**Fix (strata repo):** Split the composite classes into position-only rules, leaving `z-index` to the consumer:

```js
reg('fixed-top', 'utilities', `.fixed-top { position: fixed; top: 0; right: 0; left: 0; }`)
```

Or keep the bundled form but register it in `'components'` so any utility-layer `z-[n]` wins over it automatically.

**Affected classes:** `fixed-top`, `fixed-bottom`, `sticky-top`, `sticky-bottom`, and all responsive `sticky-{bp}-top` / `sticky-{bp}-bottom` variants.

**Fix applied:** All four classes moved from `'utilities'` to `'components'` layer. Any `z-[n]` utility class (in the utilities layer, which is declared after components) now automatically wins. `fixed-top z-[20]` produces the correct stacking order.

**Project updated:** `.lp-header` simplified from `position-fixed left-[0] right-[0] top-[0] z-[20]` → `fixed-top z-[20]`.

---

## 21. [BEHAVIOUR] Stale `resultCache` silently drops valid arbitrary classes

**Symptom:** `top-[-85px]` (or any arbitrary class) appears in HTML but produces no CSS, even though the registry pattern matches it correctly.

**Root cause:** The strata registry holds a module-level `resultCache` Map that persists for the lifetime of the Vite dev process. If a class token is looked up before it appears in a content file — or during an HMR cycle where the file mtime hasn't updated yet — strata caches `null` for that token. All subsequent builds return `null` from the cache immediately, bypassing the regex entirely. The class never generates CSS even though the pattern would now match.

**Negative values specifically:** Confirmed working. `top-[...]`, `bottom-[...]`, `left-[...]`, `right-[...]` all use `(.+)` which matches negative values (`-85px`, `-var(--x)`, etc.) and the generated selector is valid CSS.

**Fix:** Restart the dev server — this flushes the Node.js `require()` module cache and resets `resultCache` to empty. Secondary check: verify the file is covered by the `content` glob (default: `./src/**/*.{html,jsx,tsx,vue,astro,svelte,js,ts}`).

---

## 22. [LIMITATION — RESOLVED in 1.4.0] `bottom-[...]` arbitrary produces no CSS output

**Symptom:** `bottom-[...]` appeared to produce no CSS output.

**Root cause (corrected):** Same as finding #21 — content glob or stale build cache, not a strata engine issue. `bottom-[...]`, `left-[...]`, and negative arbitrary values all work correctly in 1.4.0+. The selector is valid and the CSS is emitted when the file is covered by the scanner.
