// src/scripts/ui/solar-system/MarsProgressStrip.ts
// Mars-only left progress strip — same dual-role pattern as
// EarthProgressStrip/SunProgressStrip/VenusProgressStrip/MercuryProgressStrip
// (see those files for the full rationale). Scoped entirely to
// #ex-mars-progress-strip / .ex-mars-section / #ex-mars-article-panel-body.

interface ItemLabel { number: string; label: string; }

const LABEL_SWAP_MS = 160;

export class MarsProgressStrip {

  private strip:      HTMLElement | null;
  private items:       HTMLElement[];
  private sections:    HTMLElement[];
  private overlay:     HTMLElement | null;
  private panelInner:  HTMLElement | null;
  private panelBody:   HTMLElement | null;

  private mode:            'sections' | 'article' = 'sections';
  private paragraphs:      HTMLElement[] = [];
  private originalLabels:  ItemLabel[]   = [];

  constructor() {
    this.strip      = document.getElementById('ex-mars-progress-strip');
    this.items      = Array.from(document.querySelectorAll<HTMLElement>('.ex-mars-progress-item'));
    this.sections   = Array.from(document.querySelectorAll<HTMLElement>('.ex-mars-section'));
    this.overlay    = document.getElementById('ex-content-overlay');
    this.panelInner = document.querySelector<HTMLElement>('.ex-mars-article-panel-inner');
    this.panelBody  = document.getElementById('ex-mars-article-panel-body');
  }

  init(): void {
    if (!this.strip || !this.items.length || !this.sections.length || !this.overlay) return;

    this.originalLabels = this.items.map((item) => ({
      number: item.querySelector('.ex-mars-progress-number')?.textContent ?? '',
      label:  item.querySelector('.ex-mars-progress-label')?.textContent  ?? '',
    }));

    this._bindClicks();
    this.overlay.addEventListener('scroll', this._onOverlayScroll, { passive: true });
    this.panelInner?.addEventListener('scroll', this._onPanelScroll, { passive: true });
    this._bindPanelEvents();

    this._recomputeActiveSection();
  }

  private _bindClicks(): void {
    this.items.forEach((item, i) => {
      item.addEventListener('click', () => {
        if (this.mode === 'sections') {
          this.sections[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          this.paragraphs[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  private _onOverlayScroll = (): void => {
    if (this.mode === 'sections') this._recomputeActiveSection();
  };

  private _onPanelScroll = (): void => {
    if (this.mode === 'article') this._recomputeActiveParagraph();
  };

  private _bindPanelEvents(): void {
    window.addEventListener('ct:mars-article-open',  () => this._enterArticleMode());
    window.addEventListener('ct:mars-article-close', () => this._exitArticleMode());
  }

  private _enterArticleMode(): void {
    if (!this.strip || !this.panelBody) return;
    this.mode = 'article';
    this.strip.dataset.mode = 'article';

    this.paragraphs = Array.from(this.panelBody.querySelectorAll<HTMLElement>('p'));

    this._swapLabels((_item, i) => ({
      number: String(i + 1).padStart(2, '0'),
      label:  this.paragraphs[i]?.dataset.topic || 'Read',
      inRange: i < this.paragraphs.length,
    }));

    this._recomputeActiveParagraph();
  }

  private _exitArticleMode(): void {
    if (!this.strip) return;
    this.mode = 'sections';
    this.strip.dataset.mode = 'sections';

    this._swapLabels((_item, i) => ({
      number:  this.originalLabels[i].number,
      label:   this.originalLabels[i].label,
      inRange: true,
    }));

    this._recomputeActiveSection();
  }

  private _swapLabels(next: (item: HTMLElement, i: number) => { number: string; label: string; inRange: boolean }): void {
    this.items.forEach((item, i) => {
      item.dataset.swapping = 'true';
      window.setTimeout(() => {
        const numberEl = item.querySelector<HTMLElement>('.ex-mars-progress-number');
        const labelEl  = item.querySelector<HTMLElement>('.ex-mars-progress-label');
        const result   = next(item, i);
        if (numberEl) numberEl.textContent = result.number;
        if (labelEl)  labelEl.textContent  = result.label;
        item.dataset.inRange  = String(result.inRange);
        item.dataset.swapping = 'false';
      }, LABEL_SWAP_MS);
    });
  }

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

  private _recomputeActiveParagraph(): void {
    if (!this.panelInner || !this.paragraphs.length) return;
    const panelRect = this.panelInner.getBoundingClientRect();
    const center = panelRect.top + panelRect.height / 2;

    let closestIndex = 0;
    let closestDist  = Infinity;
    this.paragraphs.forEach((p, i) => {
      const rect = p.getBoundingClientRect();
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
