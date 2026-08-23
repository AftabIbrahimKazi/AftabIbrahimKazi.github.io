// src/scripts/ui/shared/UseClickWidgetPosition.ts
// Third-party override (css-standards RULE 20): useclick.io's live.js widget renders its
// "made with useclick" pill via an inline `style` attribute we don't control, fixed at
// bottom:16px/left:16px — which overlaps the Three.js Resources badge in the same corner
// on the landing/neptune pages, and sits disconnected from the mirrored badge on the 3D
// scene pages. useclick.io's public docs have no documented option to reposition it, so
// this repositions the injected element directly once it appears, lining it up next to
// whichever badge variant is present instead of fighting an inline style from our own
// stylesheet.

const WIDGET_SELECTOR = 'a[href*="useclick.io/?utm_source=live-widget"]';
// Left-anchored badge (landing/neptune footer) — widget goes to its right.
const BADGE_LEFT_SELECTOR  = '.ex-threejs-badge';
// Right-anchored badge (3D scene corner) — widget goes to its left, staying flush right.
const BADGE_RIGHT_SELECTOR = '.ex-threejs-badge-scene';
const GAP_PX = 12;

function repositionWidget(widget: HTMLElement): void {
  const leftBadge  = document.querySelector<HTMLElement>(BADGE_LEFT_SELECTOR);
  const rightBadge = document.querySelector<HTMLElement>(BADGE_RIGHT_SELECTOR);
  const badge = leftBadge ?? rightBadge;
  if (!badge) return;

  const badgeRect = badge.getBoundingClientRect();
  widget.style.bottom = getComputedStyle(badge).bottom;
  widget.style.zIndex = getComputedStyle(badge).zIndex;

  if (leftBadge) {
    widget.style.left  = `${Math.round(badgeRect.right + GAP_PX)}px`;
  } else {
    widget.style.left  = 'auto';
    widget.style.right = `${Math.round(window.innerWidth - badgeRect.left + GAP_PX)}px`;
  }
}

function watchAndReposition(): void {
  const existing = document.querySelector<HTMLElement>(WIDGET_SELECTOR);
  if (existing) {
    repositionWidget(existing);
    return;
  }

  const observer = new MutationObserver(() => {
    const widget = document.querySelector<HTMLElement>(WIDGET_SELECTOR);
    if (widget) {
      repositionWidget(widget);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

watchAndReposition();

window.addEventListener('resize', () => {
  const widget = document.querySelector<HTMLElement>(WIDGET_SELECTOR);
  if (widget) repositionWidget(widget);
});
