// src/scripts/ui/landing/LandingHeaderHide.ts

const header = document.querySelector<HTMLElement>('.lp-header');
const scroll = document.getElementById('lp-scroll-container');

const HIDE_DELAY = (() => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--ex-duration-hide').trim();
  return raw.endsWith('ms') ? parseFloat(raw) : parseFloat(raw) * 1000;
})();

if (header && scroll) {
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let isHovered = false;

  function show(): void {
    header!.classList.remove('lp-header--hidden');
  }

  function scheduleHide(): void {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (!isHovered) header!.classList.add('lp-header--hidden');
    }, HIDE_DELAY);
  }

  function isAtTop(): boolean {
    return scroll!.scrollTop < 10;
  }

  function syncScrolledState(): void {
    header!.classList.toggle('lp-header--scrolled', !isAtTop());
  }

  scroll.addEventListener('scroll', () => {
    show();
    syncScrolledState();
    if (isAtTop()) {
      if (hideTimer) clearTimeout(hideTimer);
    } else {
      scheduleHide();
    }
  }, { passive: true });

  header.addEventListener('mouseenter', () => {
    isHovered = true;
    show();
    if (hideTimer) clearTimeout(hideTimer);
  });

  header.addEventListener('mouseleave', () => {
    isHovered = false;
    if (!isAtTop()) scheduleHide();
  });
}
