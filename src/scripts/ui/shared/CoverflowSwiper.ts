// src/scripts/ui/shared/CoverflowSwiper.ts
// Reusable 3D-coverflow Swiper preset. Every existing carousel in this
// project (LandingJournal, RepoCarousel, CommCarousel) hardcodes its own
// `new Swiper(...)` call with fixed selectors — this is the first shared
// factory: pass a container selector plus the handful of knobs a given
// section actually varies (nav/pagination elements, slide sizing,
// coverflow depth/rotate/stretch, breakpoints) and get back the live
// Swiper instance to layer any section-specific logic on top of.

import Swiper from 'swiper';
import { EffectCoverflow, Navigation, Pagination, Autoplay, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/** One hand-tuned control point: `offset` is the (unsigned) number of
 *  slide-widths from the centered slide; `x`/`z`/`rotate` are the
 *  magnitudes at that distance — sign is applied automatically per side.
 *  `opacity` (optional, defaults to 1) fades slides out toward the edges
 *  of the fan so the last visible card thins out instead of being cut off
 *  abruptly by the container edge. */
export interface ArcCurvePoint {
  offset: number;
  x: number;
  z: number;
  rotate: number;
  opacity?: number;
}

/** One gap control point, keyed by SIGNED offset (negative = slides before
 *  the active one, positive = slides after it — i.e. `slideIndex -
 *  activeIndex`, not mirrored like ArcCurvePoint) since the tuned gaps
 *  aren't necessarily symmetric left vs. right. Sorted ascending by
 *  `offset`; values beyond the first/last point clamp to that point. */
export interface GapCurvePoint {
  offset: number;
  gap: number;
}

export interface CoverflowSwiperOptions {
  /** Swiper container selector (`.swiper` root, not the track). */
  el: string;
  prevEl?: string;
  nextEl?: string;
  paginationEl?: string;
  slidesPerView?: number | 'auto';
  spaceBetween?: number;
  loop?: boolean;
  /** Autoplay delay in ms — omitted entirely disables autoplay. */
  autoplayDelay?: number;
  /** Coverflow depth/rotate/stretch/modifier — see Swiper's effect-coverflow docs.
   *  Ignored when `arcCurve` is set (that replaces the whole per-slide formula). */
  depth?: number;
  rotate?: number;
  stretch?: number;
  modifier?: number;
  slideShadows?: boolean;
  /** Hand-tuned per-offset transform curve (sorted by ascending `offset`,
   *  starting at 0). Overrides Swiper's built-in coverflow formula entirely
   *  with a piecewise-linear interpolation through these control points —
   *  use when the built-in continuous rotate/depth/stretch formula can't
   *  reproduce a specific tuned look. Offsets beyond the last point clamp
   *  to that point's values. */
  arcCurve?: ArcCurvePoint[];
  /** Per-slide margin-right override, layered on top of `arcCurve` — see
   *  GapCurvePoint. Omit to keep the base `spaceBetween` everywhere. */
  gapCurve?: GapCurvePoint[];
  /** Caps how many slides stay visible on each side of the active one
   *  (counted in whole slide-widths of `progress`) — anything beyond that
   *  is hidden outright (`visibility: hidden`) rather than left to whatever
   *  the container's own clipping does, which can behave inconsistently
   *  once slides carry a 3D `transform` (mask-image and overflow:hidden
   *  both got unreliable against perspective-transformed children in
   *  testing). `left`/`right` follow the same visual-direction meaning as
   *  GapCurvePoint's sign (negative progress = right of active). Omit for
   *  unlimited (whatever fits/clips naturally). */
  visibleRange?: { left: number; right: number };
  breakpoints?: Record<number, { slidesPerView: number | 'auto'; spaceBetween?: number }>;
  /** Mobile-first overrides for `arcCurve`/`gapCurve`/`visibleRange`, keyed
   *  by min-width (same convention as `breakpoints` above — the active
   *  override is whichever key is the largest one `<= window.innerWidth`).
   *  The hand-tuned curves above are absolute pixel values, so they don't
   *  scale down with viewport width on their own; a fan spread tuned for a
   *  1200px+ desktop container overflows a 375px phone screen. Provide a
   *  tamer curve (smaller x/z, tighter `visibleRange`, an `opacity` taper
   *  on the outermost point) for narrow viewports instead. Any field
   *  omitted from an override falls back to the base option of the same
   *  name — a mobile override only needs to state what it changes. */
  arcBreakpoints?: Record<number, { arcCurve?: ArcCurvePoint[]; gapCurve?: GapCurvePoint[]; visibleRange?: { left: number; right: number } }>;
}

function interpolateGap(curve: GapCurvePoint[], signedOffset: number): number {
  if (signedOffset <= curve[0].offset) return curve[0].gap;
  if (signedOffset >= curve[curve.length - 1].offset) return curve[curve.length - 1].gap;

  for (let i = 0; i < curve.length - 1; i += 1) {
    const lower = curve[i];
    const upper = curve[i + 1];
    if (signedOffset >= lower.offset && signedOffset <= upper.offset) {
      const span = upper.offset - lower.offset;
      const t = span === 0 ? 0 : (signedOffset - lower.offset) / span;
      return lower.gap + (upper.gap - lower.gap) * t;
    }
  }
  return curve[curve.length - 1].gap;
}

function interpolateArc(curve: ArcCurvePoint[], offset: number): { x: number; z: number; rotate: number; opacity: number } {
  // Swiper's own `slide.progress` is POSITIVE for slides before the active
  // one (visually to the left) and NEGATIVE for slides after it (visually
  // to the right) — the opposite of the intuitive "offset" reading. Sign
  // is inverted here so the curve's magnitudes land with the correct
  // polarity: left-side slides get positive x / negative rotate, right-side
  // slides get negative x / positive rotate, matching the reference values.
  const sign = offset < 0 ? 1 : -1;
  const mag = Math.abs(offset);

  let lower = curve[0];
  let upper = curve[curve.length - 1];
  for (let i = 0; i < curve.length - 1; i += 1) {
    if (mag >= curve[i].offset && mag <= curve[i + 1].offset) {
      lower = curve[i];
      upper = curve[i + 1];
      break;
    }
  }
  if (mag >= curve[curve.length - 1].offset) {
    lower = curve[curve.length - 1];
    upper = curve[curve.length - 1];
  }

  const span = upper.offset - lower.offset;
  const t = span === 0 ? 0 : (mag - lower.offset) / span;
  const lowerOpacity = lower.opacity ?? 1;
  const upperOpacity = upper.opacity ?? 1;

  return {
    x: sign * -(lower.x + (upper.x - lower.x) * t),
    z: -(lower.z + (upper.z - lower.z) * t),
    rotate: sign * (lower.rotate + (upper.rotate - lower.rotate) * t),
    opacity: lowerOpacity + (upperOpacity - lowerOpacity) * t,
  };
}

export function createCoverflowSwiper(options: CoverflowSwiperOptions): Swiper {
  const {
    el,
    prevEl,
    nextEl,
    paginationEl,
    slidesPerView = 'auto',
    spaceBetween = 24,
    loop = true,
    autoplayDelay,
    depth = 250,
    rotate = 0,
    stretch = 0,
    modifier = 1,
    slideShadows = false,
    arcCurve,
    gapCurve,
    visibleRange,
    breakpoints,
    arcBreakpoints,
  } = options;

  const container = document.querySelector<HTMLElement>(el);

  // Picks whichever arcBreakpoints key is the largest one `<= window width`
  // (mobile-first, same convention as Swiper's own `breakpoints`), and
  // layers its fields over the base arcCurve/gapCurve/visibleRange —
  // an override only needs to state what it changes.
  const activeCurves = (): { arcCurve?: ArcCurvePoint[]; gapCurve?: GapCurvePoint[]; visibleRange?: { left: number; right: number } } => {
    if (!arcBreakpoints) return { arcCurve, gapCurve, visibleRange };
    const width = window.innerWidth;
    const keys = Object.keys(arcBreakpoints).map(Number).sort((a, b) => a - b);
    let match: number | null = null;
    for (const key of keys) {
      if (width >= key) match = key;
    }
    const override = match !== null ? arcBreakpoints[match] : undefined;
    return {
      arcCurve: override?.arcCurve ?? arcCurve,
      gapCurve: override?.gapCurve ?? gapCurve,
      visibleRange: override?.visibleRange ?? visibleRange,
    };
  };

  // update()'s own internal slideTo() short-circuits (and never emits
  // 'setTranslate') once the active index stops changing — so the effect
  // module's per-slide transform never gets a chance to run from update()
  // alone. Emitting it directly is the reliable way to force the coverflow
  // rotate/scale/depth transform to (re)compute.
  //
  // Guarded on a real (nonzero) container width: this container starts out
  // hidden (display:none — the norm here, since every planet's overlay
  // content sits in the DOM simultaneously and only the active one is
  // display:block'd later via a separate event), and calling this while
  // still zero-width computes NaN for `translate` (division against a
  // zero-size grid) — a NaN translate3d/rotateY value is invalid CSS, so
  // the browser silently drops the whole `transform`, and unlike a normal
  // bad value it never self-heals on a later, valid call because Swiper's
  // own state (swiper.translate) stays NaN once corrupted. Confirmed via
  // a live instance: Swiper's own 'breakpoint' event fired while still
  // zero-width and corrupted translate to NaN this exact way.
  const resync = (sw: Swiper): void => {
    if (!container || container.clientWidth === 0) return;
    sw.update();
    sw.emit('setTranslate', sw.translate, false);
  };

  // Custom arc curve replaces the per-slide transform outright — it reads
  // each slide's continuously-updated `progress` (slide-widths from the
  // viewport center, fractional mid-drag; only available with
  // watchSlidesProgress, which the stock coverflow effect also relies on)
  // and writes translate3d/rotateY straight onto the slide element,
  // layered on top of its normal flex position exactly like the built-in
  // effect modules do.
  const applyArcCurve = (sw: Swiper): void => {
    const { arcCurve: curve, gapCurve: gaps, visibleRange: range } = activeCurves();
    if (!curve) return;
    sw.slides.forEach((slideEl, i) => {
      // `slide.progress` is only meaningful once Swiper's own update() pass
      // (watchSlidesProgress) has run against a settled, nonzero-size
      // container — before then (or whenever that division ends up
      // against a zero-size grid) Swiper leaves/sets it to `NaN`, not
      // `undefined`, so a plain `?? 0` or a bare `typeof x === 'number'`
      // check both let a NaN straight through. Falling back to the
      // discrete index distance from the active slide — always available,
      // no timing dependency — keeps every card correctly positioned/
      // hidden even before real progress ever populates, and is
      // numerically equivalent to it at rest (one unit per slide-width).
      const raw = (slideEl as HTMLElement & { progress?: number }).progress;
      const progress = typeof raw === 'number' && !Number.isNaN(raw) ? raw : sw.activeIndex - i;
      const { x, z, rotate: r, opacity } = interpolateArc(curve, progress);
      (slideEl as HTMLElement).style.transform = `translate3d(${x}px, 0px, ${z}px) rotateY(${r}deg)`;
      (slideEl as HTMLElement).style.zIndex = String(100 - Math.round(Math.abs(progress) * 10));
      (slideEl as HTMLElement).style.opacity = String(opacity);
      if (gaps) {
        // gapCurve is keyed by slideIndex - activeIndex (negative = before/
        // left), the opposite polarity of Swiper's own `progress`.
        (slideEl as HTMLElement).style.marginRight = `${interpolateGap(gaps, -progress)}px`;
      }
      if (range) {
        // progress > 0 is left of active, progress < 0 is right — matches
        // GapCurvePoint's polarity note above.
        const beyondLeft  = progress > 0 && progress > range.left + 0.5;
        const beyondRight = progress < 0 && -progress > range.right + 0.5;
        const hidden = beyondLeft || beyondRight;
        (slideEl as HTMLElement).style.visibility   = hidden ? 'hidden' : '';
        (slideEl as HTMLElement).style.pointerEvents = hidden ? 'none' : '';
      }
    });
  };

  const swiper = new Swiper(el, {
    modules: [...(arcCurve ? [] : [EffectCoverflow]), Navigation, Pagination, Keyboard, ...(autoplayDelay ? [Autoplay] : [])],
    ...(arcCurve ? { watchSlidesProgress: true } : { effect: 'coverflow', coverflowEffect: { rotate, stretch, depth, modifier, slideShadows } }),
    grabCursor: true,
    centeredSlides: true,
    slidesPerView,
    spaceBetween,
    loop,
    keyboard: { enabled: true },
    ...(prevEl && nextEl ? { navigation: { prevEl, nextEl } } : {}),
    ...(paginationEl ? { pagination: { el: paginationEl, clickable: true } } : {}),
    ...(autoplayDelay ? { autoplay: { delay: autoplayDelay, disableOnInteraction: false } } : {}),
    ...(breakpoints ? { breakpoints } : {}),
    on: {
      init: (sw: Swiper) => { resync(sw); applyArcCurve(sw); },
      breakpoint: (sw: Swiper) => { resync(sw); applyArcCurve(sw); },
      resize: (sw: Swiper) => { applyArcCurve(sw); },
      ...(arcCurve ? { setTranslate: applyArcCurve, progress: applyArcCurve } : {}),
    },
  });

  // The real fix for the hidden-at-init case: once this container actually
  // gets a nonzero size (tab activation, window resize), resync against
  // that real size. No extra wiring required from the caller.
  if (container && 'ResizeObserver' in window) {
    let lastWidth = container.clientWidth;
    const observer = new ResizeObserver(() => {
      if (container.clientWidth === lastWidth || container.clientWidth === 0) return;
      lastWidth = container.clientWidth;
      resync(swiper);
      applyArcCurve(swiper);
    });
    observer.observe(container);
  }

  return swiper;
}
