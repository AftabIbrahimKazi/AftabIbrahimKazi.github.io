// src/scripts/ui/solar-system/ExploreOverlayController.ts

import { gsap } from 'gsap';
import {
  PlanetScrollCamera,
  MERCURY_SCROLL_PATH, VENUS_SCROLL_PATH,
  EARTH_SCROLL_PATH,   MARS_SCROLL_PATH,    JUPITER_SCROLL_PATH,
  SATURN_SCROLL_PATH,  URANUS_SCROLL_PATH,  NEPTUNE_SCROLL_PATH, SUN_SCROLL_PATH,
} from './PlanetScrollCameras';
import type { ScrollCameraConfig } from './PlanetScrollCameras';


// ── Swiper constants ──────────────────────────────────────────

/** px of movement before the gesture axis (h vs v) is locked in */
const LOCK_PX     = 6;

/** px of horizontal travel required to commit a navigation */
const COMMIT_PX   = 20;

/** px/ms — a flick above this velocity always commits regardless of distance */
const COMMIT_VEL  = 0.12;

/** Number of recent pointer samples used to compute a stable velocity */
const VEL_SAMPLES = 5;

/**
 * scrollTop must be ≤ this for swipe / arrow-key navigation to be active.
 * Once the user has scrolled into the content section, gestures scroll, not navigate.
 */
const HERO_THRESHOLD = 8;


// ── Other constants ───────────────────────────────────────────

const PLANET_ORDER = [
  'ex-sun-js', 'ex-mercury-js', 'ex-venus-js', 'ex-earth-js', 'ex-mars-js',
  'ex-jupiter-js', 'ex-saturn-js', 'ex-uranus-js', 'ex-neptune-js',
];

const PLANET_NAMES: Record<string, string> = {
  'ex-sun-js':     'The Sun',  'ex-mercury-js': 'Mercury', 'ex-venus-js':   'Venus',
  'ex-earth-js':   'Earth',    'ex-mars-js':    'Mars',    'ex-jupiter-js': 'Jupiter',
  'ex-saturn-js':  'Saturn',   'ex-uranus-js':  'Uranus',  'ex-neptune-js': 'Neptune',
};

const PLANET_META: Record<string, { name: string; tagline: string }> = {
  'ex-sun-js':     { name: 'The Sun',  tagline: 'G-type main-sequence star at the centre of our solar system' },
  'ex-mercury-js': { name: 'Mercury',  tagline: 'The swiftest planet — a world of extremes' },
  'ex-venus-js':   { name: 'Venus',    tagline: "Earth's twin in size, but a runaway greenhouse world" },
  'ex-earth-js':   { name: 'Earth',    tagline: 'The only known harbour of life in the cosmos' },
  'ex-mars-js':    { name: 'Mars',     tagline: "The Red Planet — humanity's next frontier" },
  'ex-jupiter-js': { name: 'Jupiter',  tagline: '95 moons and a storm older than nations' },
  'ex-saturn-js':  { name: 'Saturn',   tagline: 'The ringed jewel of the outer solar system' },
  'ex-uranus-js':  { name: 'Uranus',   tagline: 'An ice giant rolling sideways through the void' },
  'ex-neptune-js': { name: 'Neptune',  tagline: 'Get in touch — freelance, collaborations, and conversations' },
};


export class ExploreOverlayController {

  // ── DOM Refs ──────────────────────────────────────────────
  private overlay!:   HTMLElement;
  private hero:       HTMLElement | null = null;
  private navHint:    HTMLElement | null = null;
  private scrollHint: HTMLElement | null = null;
  private prevLabel:  HTMLElement | null = null;
  private nextLabel:  HTMLElement | null = null;
  private prevIcon:   HTMLElement | null = null;
  private nextIcon:   HTMLElement | null = null;
  private planetName: HTMLElement | null = null;
  private planetTag:  HTMLElement | null = null;

  // ── State ─────────────────────────────────────────────────
  private isOpen:              boolean = false;
  private activePlanet:        string  = '';
  private _isDragging:         boolean = false;
  private _swipeEndTime:       number  = 0;
  private _isLooping:          boolean = false;
  /** Pending scroll-cam activation — cancelled and rescheduled on each navigate */
  private _scrollCamTimeout:   ReturnType<typeof setTimeout> | null = null;

  // ── Scroll cameras ────────────────────────────────────────
  private _mercuryScrollCam: PlanetScrollCamera;
  private _venusScrollCam:   PlanetScrollCamera;
  private _earthScrollCam:   PlanetScrollCamera;
  private _marsScrollCam:    PlanetScrollCamera;
  private _jupiterScrollCam: PlanetScrollCamera;
  private _saturnScrollCam:  PlanetScrollCamera;
  private _uranusScrollCam:  PlanetScrollCamera;
  private _neptuneScrollCam: PlanetScrollCamera;
  private _sunScrollCam:     PlanetScrollCamera;
  private _activeScrollCam:  PlanetScrollCamera | null = null;

  // ── Scroll detection ──────────────────────────────────────
  private _scrollTimer:    ReturnType<typeof setTimeout> | null = null;
  private _scrollHandler!: () => void;

  private static readonly SCROLL_TOP_THRESHOLD = 4;
  private static readonly SCROLL_DEBOUNCE_MS   = 120;

  constructor(
    mercuryScrollCam: PlanetScrollCamera,
    venusScrollCam:   PlanetScrollCamera,
    earthScrollCam:   PlanetScrollCamera,
    marsScrollCam:    PlanetScrollCamera,
    jupiterScrollCam: PlanetScrollCamera,
    saturnScrollCam:  PlanetScrollCamera,
    uranusScrollCam:  PlanetScrollCamera,
    neptuneScrollCam: PlanetScrollCamera,
    sunScrollCam:     PlanetScrollCamera,
  ) {
    const overlay = document.getElementById('ex-content-overlay') as HTMLElement | null;
    if (!overlay) return;

    this.overlay           = overlay;
    this._mercuryScrollCam = mercuryScrollCam;
    this._venusScrollCam   = venusScrollCam;
    this._earthScrollCam   = earthScrollCam;
    this._marsScrollCam    = marsScrollCam;
    this._jupiterScrollCam = jupiterScrollCam;
    this._saturnScrollCam  = saturnScrollCam;
    this._uranusScrollCam  = uranusScrollCam;
    this._neptuneScrollCam = neptuneScrollCam;
    this._sunScrollCam     = sunScrollCam;
    this._scrollHandler    = this._onScroll.bind(this);
    this._setup();
  }

  // ── Private — Camera / Config Maps ───────────────────────

  private _getScrollCam(planetKey: string): PlanetScrollCamera | null {
    const map: Record<string, PlanetScrollCamera> = {
      'ex-mercury-js': this._mercuryScrollCam,
      'ex-venus-js':   this._venusScrollCam,
      'ex-earth-js':   this._earthScrollCam,
      'ex-mars-js':    this._marsScrollCam,
      'ex-jupiter-js': this._jupiterScrollCam,
      'ex-saturn-js':  this._saturnScrollCam,
      'ex-uranus-js':  this._uranusScrollCam,
      'ex-neptune-js': this._neptuneScrollCam,
      'ex-sun-js':     this._sunScrollCam,
    };
    return map[planetKey] ?? null;
  }

  private _getScrollConfig(planetKey: string): ScrollCameraConfig | null {
    const map: Record<string, ScrollCameraConfig> = {
      'ex-mercury-js': MERCURY_SCROLL_PATH,
      'ex-venus-js':   VENUS_SCROLL_PATH,
      'ex-earth-js':   EARTH_SCROLL_PATH,
      'ex-mars-js':    MARS_SCROLL_PATH,
      'ex-jupiter-js': JUPITER_SCROLL_PATH,
      'ex-saturn-js':  SATURN_SCROLL_PATH,
      'ex-uranus-js':  URANUS_SCROLL_PATH,
      'ex-neptune-js': NEPTUNE_SCROLL_PATH,
      'ex-sun-js':     SUN_SCROLL_PATH,
    };
    return map[planetKey] ?? null;
  }

  // ── Private — Setup ───────────────────────────────────────

  private _setup(): void {
    this._setupDOM();
    this._bindGlobalEvents();
    this._bindSwipeEvents();
    this._bindKeyboardEvents();
  }

  private _setupDOM(): void {
    this.hero       = document.getElementById('ex-overlay-hero-ts');
    this.navHint    = document.getElementById('ex-overlay-nav-hint-ts');
    this.scrollHint = document.getElementById('ex-overlay-scroll-hint-ts');
    this.prevLabel  = document.getElementById('ex-overlay-prev-label-ts');
    this.nextLabel  = document.getElementById('ex-overlay-next-label-ts');
    this.prevIcon   = this.navHint?.querySelector('.ex-overlay-nav-prev .ex-icon') as HTMLElement ?? null;
    this.nextIcon   = this.navHint?.querySelector('.ex-overlay-nav-next .ex-icon') as HTMLElement ?? null;
    this.planetName = document.getElementById('ex-overlay-planet-name-ts');
    this.planetTag  = document.getElementById('ex-overlay-planet-tagline-ts');
  }

  private _bindGlobalEvents(): void {
    window.addEventListener('ct:explore-mode', (e: Event) => {
      const { planetKey } = (e as CustomEvent<{ planetKey: string }>).detail;
      this.open(planetKey);
    });
    window.addEventListener('ct:scene-mode',    () => this.close());
    window.addEventListener('ct:close-overlay', () => this.close());
  }

  // ── Private — Swipe ───────────────────────────────────────
  //
  //  Design principles
  //  ─────────────────
  //  • Camera does NOT move during the drag — only after commit.
  //    Moving the camera during drag switches planet focus mid-gesture
  //    which looks wrong (flying to a completely different 3D position
  //    while the user is still holding the pointer).
  //  • Axis is locked once, never changes mid-gesture.
  //  • Overlay follows the finger 1:1 in X — immediate physical feedback.
  //  • On commit: overlay springs back, then _navigateTo fires the cinematic
  //    camera transition uncontested (old scroll cam is already stopped).
  //  • On cancel: overlay snaps back, no camera movement.
  //  • Velocity is a rolling window average (VEL_SAMPLES frames) so fast
  //    flicks on slow devices still register reliably.
  //  • { passive: false } on pointermove lets us call e.preventDefault()
  //    once horizontal intent is confirmed, preventing the browser from
  //    starting a vertical scroll mid-swipe.
  //  • touch-action: pan-y in explore-overlay.css tells the browser to hand
  //    horizontal events to JS before its own scroll logic runs (iOS Safari).

  private _bindSwipeEvents(): void {

    // ── Per-gesture state ─────────────────────────────────
    let startX: number           = 0;
    let startY: number           = 0;
    let active: boolean          = false;
    let axis:   'h' | 'v' | null = null;

    // Rolling position/time buffer for stable velocity
    const buf: { x: number; t: number }[] = [];

    // Track any in-flight snap-back so we can kill it on a new drag
    let snapTween: gsap.core.Tween | null = null;

    // ── Helpers ───────────────────────────────────────────

    const resetGesture = (): void => {
      active           = false;
      axis             = null;
      this._isDragging = false;
      buf.length       = 0;
    };

    const getVelocity = (): number => {
      // Span the full sample window — avoids single-frame spikes
      if (buf.length < 2) return 0;
      const first = buf[0];
      const last  = buf[buf.length - 1];
      const dt    = last.t - first.t;
      return dt > 0 ? (last.x - first.x) / dt : 0;
    };

    const snapBack = (): void => {
      snapTween = gsap.to(this.overlay, { x: 0, duration: 0.35, ease: 'power3.out' });
    };

    // ── Pointer handlers ──────────────────────────────────

    this.overlay.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!this.isOpen)                              return;
      if (this.overlay.scrollTop > HERO_THRESHOLD)  return;

      // Kill any ongoing snap-back before starting a fresh gesture
      snapTween?.kill();
      snapTween = null;

      startX = e.clientX;
      startY = e.clientY;
      buf.length = 0;
      buf.push({ x: e.clientX, t: e.timeStamp });

      active           = true;
      axis             = null;
      this._isDragging = true;

      // Keeps receiving events even if the pointer leaves the element
      try { this.overlay.setPointerCapture(e.pointerId); } catch (_) {}
    });

    // { passive: false } required so e.preventDefault() is allowed inside
    this.overlay.addEventListener('pointermove', (e: PointerEvent) => {
      if (!active || !this.isOpen) return;

      buf.push({ x: e.clientX, t: e.timeStamp });
      if (buf.length > VEL_SAMPLES) buf.shift();

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      // Lock axis once sufficient movement has accumulated
      if (axis === null && (Math.abs(dx) > LOCK_PX || Math.abs(dy) > LOCK_PX)) {
        axis = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
      }

      if (axis !== 'h') return;

      // Prevent the browser starting a vertical scroll once horizontal intent is confirmed
      e.preventDefault();

      // Move overlay 1:1 with the finger — physical feedback without moving the camera
      gsap.set(this.overlay, { x: dx });

    }, { passive: false });

    this.overlay.addEventListener('pointerup', (e: PointerEvent) => {
      if (!active || !this.isOpen) return;

      const dx     = e.clientX - startX;
      const vel    = getVelocity();
      const absDx  = Math.abs(dx);
      const absVel = Math.abs(vel);

      // Resolve axis for gestures that ended before axis could be locked
      if (axis === null && absDx > LOCK_PX) {
        axis = absDx >= Math.abs(e.clientY - startY) ? 'h' : 'v';
      }

      this._swipeEndTime = Date.now();

      const shouldCommit =
        axis    === 'h'       &&
        (absDx  >= COMMIT_PX  ||
         absVel >= COMMIT_VEL);

      if (shouldCommit) {
        snapTween = gsap.to(this.overlay, { x: 0, duration: 0.4, ease: 'power2.out' });
        this._navigateTo(dx < 0 ? 'next' : 'prev');
      } else {
        snapBack();
      }

      resetGesture();
    });

    this.overlay.addEventListener('pointercancel', () => {
      if (!active) return;
      snapBack();
      resetGesture();
    });
  }

  // ── Private — Keyboard Navigation ────────────────────────

  private _bindKeyboardEvents(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.isOpen)                             return;
      if (this.overlay.scrollTop > HERO_THRESHOLD) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); this._navigateTo('next'); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); this._navigateTo('prev'); }
    });
  }

  // ── Private — Shared Navigation ──────────────────────────

  /**
   * Single commit point for every navigation — swipe, keyboard, or any
   * future trigger such as on-screen buttons.
   *
   * Sequencing is critical:
   *  1. Cancel any pending scroll-cam activation from the previous navigate
   *  2. Silently stop the current scroll cam (no return tween) so the camera
   *     is completely free before the transition starts
   *  3. Fire ct:carousel-navigate — focusOnObject tween starts uncontested
   *  4. Swap overlay content immediately (instant DOM swap, no flash)
   *  5. Schedule new scroll-cam activation AFTER the camera tween settles
   *     (carousel tween = 1.8 s, we wait 2 s to be safe)
   *
   * Without step 2 / the delay in step 5, three things fight for the camera
   * simultaneously: the old scroll cam's return tween, the new focusOnObject
   * tween, and the new scroll cam's per-frame lerp — resulting in a camera
   * that barely moves or jerks instead of gliding cinematically.
   */
  private _navigateTo(direction: 'next' | 'prev'): void {
    if (!this.isOpen) return;

    const currentIndex = PLANET_ORDER.indexOf(this.activePlanet);
    const nextIndex    = direction === 'next'
      ? (currentIndex + 1) % PLANET_ORDER.length
      : (currentIndex - 1 + PLANET_ORDER.length) % PLANET_ORDER.length;
    const targetPlanet = PLANET_ORDER[nextIndex];

    // 1. Cancel any previously scheduled scroll-cam activation
    if (this._scrollCamTimeout !== null) {
      clearTimeout(this._scrollCamTimeout);
      this._scrollCamTimeout = null;
    }

    // 2. Stop current scroll cam instantly — no return tween — camera stays put
    this._activeScrollCam?.deactivate(true);
    this._activeScrollCam = null;

    // 3. Fire cinematic camera transition (now completely uncontested)
    window.dispatchEvent(new CustomEvent('ct:carousel-navigate', { detail: { planetKey: targetPlanet } }));

    // 4. Swap overlay content
    this._updateContent(targetPlanet);

    // 5. Activate new scroll cam only after the camera tween has settled.
    //    The carousel tween duration is 1.8 s — 200 ms headroom = 2 s.
    //    Guard against rapid successive swipes with the activePlanet check.
    this._scrollCamTimeout = setTimeout(() => {
      this._scrollCamTimeout = null;
      if (!this.isOpen || this.activePlanet !== targetPlanet) return;
      this._activeScrollCam = this._getScrollCam(targetPlanet);
      const config = this._getScrollConfig(targetPlanet);
      if (this._activeScrollCam && config) this._activeScrollCam.activate(config);
    }, 2000);
  }

  // ── Public API ────────────────────────────────────────────

  open(planetKey: string): void {
    if (this.isOpen) return;
    this.isOpen       = true;
    this.activePlanet = planetKey;
    this._updateContent(planetKey);
    this.overlay.dataset.overlayState = 'open';
    this.overlay.scrollTop = 0;
    if (this.navHint) gsap.killTweensOf(this.navHint);
    gsap.set(this.overlay, { x: 0 });
    gsap.fromTo(this.overlay,
      { y: '100%' },
      {
        y: '0%', duration: 1.2, ease: 'power3.inOut',
        onComplete: () => {
          this._onOverlayLanded();
          this._activeScrollCam = this._getScrollCam(planetKey);
          if (this._activeScrollCam) this._activeScrollCam.activate(this._getScrollConfig(planetKey)!);
        },
      }
    );
    document.body.dataset.scrollState = 'locked';
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this._scrollCamTimeout !== null) {
      clearTimeout(this._scrollCamTimeout);
      this._scrollCamTimeout = null;
    }
    this._activeScrollCam?.deactivate();
    this._activeScrollCam = null;
    this.overlay.removeEventListener('scroll', this._scrollHandler);
    if (this.navHint) { gsap.killTweensOf(this.navHint); gsap.set(this.navHint, { opacity: 0, y: 0 }); }
    if (this.prevIcon) gsap.killTweensOf(this.prevIcon);
    if (this.nextIcon) gsap.killTweensOf(this.nextIcon);
    gsap.killTweensOf(this.overlay);
    this.overlay.scrollTop = 0;
    gsap.to(this.overlay, {
      y: '100%', duration: 0.9, ease: 'power3.inOut',
      onComplete: () => {
        document.body.dataset.scrollState = 'auto';
        this.overlay.dataset.overlayState = 'closed';
        this.overlay.dataset.planet = '';
        this.activePlanet = '';
        if (this.planetName) this.planetName.textContent = '';
        if (this.planetTag)  this.planetTag.textContent  = '';
        if (this.prevLabel)  this.prevLabel.textContent  = '';
        if (this.nextLabel)  this.nextLabel.textContent  = '';
      },
    });
  }

  get currentPlanet(): string { return this.activePlanet; }

  // ── Private — Content & Labels ────────────────────────────

  private _updateContent(planetKey: string): void {
    const meta         = PLANET_META[planetKey];
    const currentIndex = PLANET_ORDER.indexOf(planetKey);
    const prevKey      = PLANET_ORDER[(currentIndex - 1 + PLANET_ORDER.length) % PLANET_ORDER.length];
    const nextKey      = PLANET_ORDER[(currentIndex + 1) % PLANET_ORDER.length];
    this.overlay.setAttribute('data-planet', planetKey);
    this.activePlanet = planetKey;
    if (meta) {
      if (this.planetName) this.planetName.textContent = meta.name;
      if (this.planetTag)  this.planetTag.textContent  = meta.tagline;
    }
    if (this.prevLabel) this.prevLabel.textContent = PLANET_NAMES[prevKey] ?? '';
    if (this.nextLabel) this.nextLabel.textContent = PLANET_NAMES[nextKey] ?? '';
  }

  // ── Private — Hint Animations ─────────────────────────────

  private _restartHintAnimations(): void {
    if (this.scrollHint) gsap.to(this.scrollHint, { y: 5,  duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    if (this.prevIcon)   gsap.to(this.prevIcon,   { x: -5, duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    if (this.nextIcon)   gsap.to(this.nextIcon,   { x: 5,  duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }

  private _onOverlayLanded(): void {
    if (this.navHint) {
      gsap.fromTo(this.navHint,
        { opacity: 0, y: 6 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', onComplete: () => this._restartHintAnimations() }
      );
    }
    this.overlay.addEventListener('scroll', this._scrollHandler, { passive: true });
  }

  // ── Private — Scroll-Past Exit ────────────────────────────

  private _scrollPastExit(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this._scrollCamTimeout !== null) {
      clearTimeout(this._scrollCamTimeout);
      this._scrollCamTimeout = null;
    }
    this.overlay.removeEventListener('scroll', this._scrollHandler);

    if (this.navHint) { gsap.killTweensOf(this.navHint); gsap.set(this.navHint, { opacity: 0 }); }
    if (this.prevIcon) gsap.killTweensOf(this.prevIcon);
    if (this.nextIcon) gsap.killTweensOf(this.nextIcon);

    window.dispatchEvent(new CustomEvent('ct:scroll-past-exit'));
    this._activeScrollCam = null;

    gsap.to(this.overlay, {
      y: '100%',
      duration: 1.0,
      ease: 'power2.in',
      onComplete: () => {
        document.body.dataset.scrollState = 'auto';
        this.overlay.dataset.overlayState = 'closed';
        this.overlay.dataset.planet = '';
        this.activePlanet = '';
        this._isLooping   = false;
        gsap.set(this.overlay, { y: '100%', opacity: 1 });
        if (this.planetName) this.planetName.textContent = '';
        if (this.planetTag)  this.planetTag.textContent  = '';
        if (this.prevLabel)  this.prevLabel.textContent  = '';
        if (this.nextLabel)  this.nextLabel.textContent  = '';
      },
    });
  }

  private _onScroll(): void {
    if (this._isDragging) return;
    if (this._isLooping)  return;
    if (Date.now() - this._swipeEndTime < 300) return;
    if (this._scrollTimer !== null) clearTimeout(this._scrollTimer);

    if (this.overlay.scrollTop <= ExploreOverlayController.SCROLL_TOP_THRESHOLD) {
      this._scrollTimer = setTimeout(() => {
        if (this.overlay.scrollTop <= ExploreOverlayController.SCROLL_TOP_THRESHOLD) {
          window.dispatchEvent(new CustomEvent('ct:close-overlay'));
        }
      }, ExploreOverlayController.SCROLL_DEBOUNCE_MS);
    }

    const atBottom = this.overlay.scrollTop + this.overlay.clientHeight >= this.overlay.scrollHeight - 20;
    if (atBottom && !this._isLooping) {
      this._isLooping = true;
      this._scrollPastExit();
    }
  }
}
