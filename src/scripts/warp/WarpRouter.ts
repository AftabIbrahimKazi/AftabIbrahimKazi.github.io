// src/scripts/warp/WarpRouter.ts
// Global warp transition system — plays warp on every page navigation.
//
// Forward warp: intercepts ALL internal link clicks → plays warp → navigates.
// Reverse warp: plays on every page entry (covers direct load, back, forward, bfcache).
//
// Usage (call once per page, as early as possible):
//   WarpRouter.init(canvas)

import { WarpTransition } from './WarpTransition';

// Planet/page glow colors — RGB 0–1, matched to each body's visual identity
const PAGE_COLORS: Record<string, [number, number, number]> = {
  '/':         [0.72, 0.84, 1.00],  // landing  — nebula blue-white
  '/sol':      [1.00, 0.95, 0.78],  // sol      — warm sun yellow (default)
  '/mercury':  [0.96, 0.78, 0.26],  // Budha    — golden yellow
  '/venus':    [0.91, 0.66, 0.49],  // Shukra   — warm amber
  '/earth':    [0.31, 0.64, 0.88],  // Bhumi    — ocean blue
  '/mars':     [0.85, 0.30, 0.08],  // Mangala  — iron red
  '/jupiter':  [0.82, 0.60, 0.30],  // Guru     — ochre gold
  '/saturn':   [0.92, 0.86, 0.62],  // Shani    — pale gold
  '/uranus':   [0.44, 0.90, 0.88],  // Indra    — cyan teal
  '/neptune':  [0.32, 0.48, 0.92],  // Varuna   — deep blue
};

const DEFAULT_COLOR: [number, number, number] = [1.0, 0.95, 0.78];

// How long the veil holds fully opaque on entry before the reverse warp is
// allowed to show through — gives the scene a moment to finish its first frame.
const WARP_VEIL_HOLD_MS = 220;

function pageColor(path: string): [number, number, number] {
  const [stripped, query] = path.split('?');
  const target = new URLSearchParams(query ?? '').get('target');
  if (target) return PAGE_COLORS[`/${target}`] ?? DEFAULT_COLOR;
  const key = stripped.length > 1 ? stripped.replace(/\/$/, '') : stripped;
  return PAGE_COLORS[key] ?? DEFAULT_COLOR;
}

export class WarpRouter {

  private static _warp: WarpTransition | null = null;

  static init(canvas: HTMLCanvasElement): void {
    this._warp = new WarpTransition(canvas);

    // Always play reverse on entry — covers all cases including back button
    this._playEntry();

    // Intercept all internal link clicks for forward warp
    document.addEventListener('click', this._onLinkClick.bind(this), true);

    // bfcache: browser restored page from cache (back/forward without reload)
    // pageshow fires AFTER the page is visible — play reverse again to re-cover
    window.addEventListener('pageshow', (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page came from bfcache — replay reverse warp
        this._playEntry();
      }
    });

    // pagehide fires before the page is hidden/suspended into bfcache — force the
    // veil opaque synchronously so whatever DOM snapshot gets frozen is already
    // covered. Without this, a restored bfcache page paints its frozen
    // veil-transparent state before pageshow's persisted handler above re-covers
    // it, producing the same flash this whole state machine exists to prevent.
    window.addEventListener('pagehide', () => {
      const veil = this._veil();
      if (veil) veil.dataset.veilState = 'instant-on';
    });
  }

  private static _veil(): HTMLElement | null {
    return document.getElementById('ex-warp-veil');
  }

  private static _playEntry(): void {
    if (!this._warp) return;

    // Color matches the page we just arrived on — include search so ?target= is resolved
    this._warp.setColor(...pageColor(window.location.pathname + window.location.search));

    // Veil starts opaque (covers scene, matches its default markup state so the
    // very first paint is already covered — no gap waiting on this script to run),
    // fades out after warp reveals, then rests on the fully-hidden terminal state.
    const veil = this._veil();
    if (veil) {
      veil.dataset.veilState = 'instant-on';
      setTimeout(() => {
        veil.dataset.veilState = 'fading-out';
        veil.addEventListener('transitionend', () => {
          veil.dataset.veilState = 'hidden';
        }, { once: true });
      }, WARP_VEIL_HOLD_MS);
    }

    // Start the render loop for the reverse warp
    const warp = this._warp;
    const canvas = document.getElementById('ex-warp-canvas') as HTMLCanvasElement | null;
    warp.playReverse(() => {
      if (canvas) canvas.dataset.canvasState = 'done';
    });

    let rafId = 0;
    const clock = { prev: performance.now() };

    const tick = () => {
      if (!warp.isActive) { cancelAnimationFrame(rafId); return; }
      rafId = requestAnimationFrame(tick);
      const now   = performance.now();
      const delta = Math.min((now - clock.prev) / 1000, 0.1); // cap at 100ms
      clock.prev  = now;
      warp.update(delta, now / 1000);
    };

    rafId = requestAnimationFrame(tick);
  }

  private static _onLinkClick(e: MouseEvent): void {
    // Find closest <a> ancestor
    const target = e.target as Element | null;
    if (!target) return;
    const a = target.closest('a[href]') as HTMLAnchorElement | null;
    if (!a) return;

    // Ignore: new tab, external, anchor-only, download, already handled
    if (a.target === '_blank')      return;
    if (a.hasAttribute('download')) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;

    const href = a.getAttribute('href') ?? '';
    if (!href || href.startsWith('#'))       return;
    if (href.startsWith('http') || href.startsWith('//')) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

    // It's an internal navigation — intercept
    e.preventDefault();
    e.stopPropagation();

    this._navigateTo(href);
  }

  private static _navigateTo(href: string): void {
    if (!this._warp) { window.location.href = href; return; }

    const warp = this._warp;

    // If warp is already active (e.g., user double-clicks), just navigate
    if (warp.isActive) { window.location.href = href; return; }

    // Color matches the destination page
    warp.setColor(...pageColor(href));

    // Veil fades in immediately, covering the scene as warp fires up
    const veil = this._veil();
    if (veil) {
      veil.dataset.veilState = 'fading-in';
    }

    warp.playForward(() => {
      window.location.href = href;
    });

    let rafId = 0;
    const clock = { prev: performance.now() };

    const tick = () => {
      if (!warp.isActive) { cancelAnimationFrame(rafId); return; }
      rafId = requestAnimationFrame(tick);
      const now   = performance.now();
      const delta = Math.min((now - clock.prev) / 1000, 0.1);
      clock.prev  = now;
      warp.update(delta, now / 1000);
    };

    rafId = requestAnimationFrame(tick);
  }
}
