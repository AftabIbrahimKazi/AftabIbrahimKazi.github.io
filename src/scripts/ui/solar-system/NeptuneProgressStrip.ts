// src/scripts/ui/solar-system/NeptuneProgressStrip.ts
// Neptune-only left progress strip — sections mode only. Unlike the other
// planet strips (Mercury/Venus/Sun/Earth/Mars/Jupiter/Saturn/Uranus),
// Neptune has no detail/article panel — it's a short 5-section contact
// page, so there is no second pagination mode to switch into. Active-item
// tracking is scroll-driven (nearest-to-center), the same pattern the
// other progress strips use. Scoped entirely to #ex-neptune-progress-strip
// / .ex-neptune-section.

export class NeptuneProgressStrip {

  private strip:    HTMLElement | null;
  private items:    HTMLElement[];
  private sections: HTMLElement[];
  private overlay:  HTMLElement | null;

  constructor() {
    this.strip    = document.getElementById('ex-neptune-progress-strip');
    this.items    = Array.from(document.querySelectorAll<HTMLElement>('.ex-neptune-progress-item'));
    this.sections = Array.from(document.querySelectorAll<HTMLElement>('.ex-neptune-section'));
    this.overlay  = document.getElementById('ex-content-overlay');
  }

  init(): void {
    if (!this.strip || !this.items.length || !this.sections.length || !this.overlay) return;

    this._bindClicks();
    this.overlay.addEventListener('scroll', this._onOverlayScroll, { passive: true });

    this._recomputeActiveSection();
  }

  private _bindClicks(): void {
    this.items.forEach((item, i) => {
      item.addEventListener('click', () => {
        this.sections[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  private _onOverlayScroll = (): void => {
    this._recomputeActiveSection();
  };

  private _recomputeActiveSection(): void {
    if (!this.overlay) return;
    const overlayRect = this.overlay.getBoundingClientRect();
    const center = overlayRect.top + overlayRect.height / 2;

    let closestIndex = 0;
    let closestDist  = Infinity;
    this.sections.forEach((section, i) => {
      const rect = section.getBoundingClientRect();
      const dist = Math.abs((rect.top + rect.height / 2) - center);
      if (dist < closestDist) { closestDist = dist; closestIndex = i; }
    });
    this._setActive(closestIndex);
  }

  private _setActive(activeIndex: number): void {
    this.items.forEach((item, i) => {
      item.dataset.active = String(i === activeIndex);
    });
  }
}
