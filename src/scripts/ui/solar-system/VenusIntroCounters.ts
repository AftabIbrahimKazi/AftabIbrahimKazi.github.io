// src/scripts/ui/solar-system/VenusIntroCounters.ts
// Counts each `.ex-venus-counter` up from 0 to its `data-count-to` value
// once it scrolls into view inside the Venus overlay. Scoped to the
// overlay's own scroll container (#ex-content-overlay) as the observer root
// since the overlay scrolls internally, not the window.

const COUNT_DURATION_MS = 1200;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function animateCount(el: HTMLElement): void {
  const target = parseFloat(el.dataset.countTo ?? '0');
  const suffix = el.dataset.countSuffix ?? '';
  const start  = performance.now();

  const tick = (now: number): void => {
    const progress = Math.min((now - start) / COUNT_DURATION_MS, 1);
    const value     = Math.round(target * easeOutCubic(progress));
    el.textContent  = `${value}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

export class VenusIntroCounters {

  private counters: HTMLElement[];
  private root:     HTMLElement | null;

  constructor() {
    this.counters = Array.from(document.querySelectorAll<HTMLElement>('.ex-venus-counter'));
    this.root     = document.getElementById('ex-content-overlay');
  }

  init(): void {
    if (!this.counters.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        });
      },
      { root: this.root, threshold: 0.6 },
    );

    this.counters.forEach((el) => observer.observe(el));
  }
}
