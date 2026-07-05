// src/scripts/ui/landing/LandingDotNav.ts

const LABELS = ['01 — ORIGIN', '02 — THE STORY', '03 — THE SYSTEM', '04 — FEATURED', '05 — THE WORK', '06 — JOURNAL', '07 — THE JOURNEY'];
const label  = document.getElementById('lp-section-label');
const dots   = document.querySelectorAll<HTMLButtonElement>('.lp-dot');
const scroll = document.getElementById('lp-scroll-container');

function setActive(idx: number): void {
  if (label) label.textContent = LABELS[idx] ?? LABELS[0];
  dots.forEach((d, i) => { d.dataset.active = String(i === idx); });
}

function getScrollTargets(): HTMLElement[] {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('.lp-section'));
  const footer   = document.querySelector<HTMLElement>('.lp-footer');
  return footer ? [...sections, footer] : sections;
}

dots.forEach((dot, i) => {
  dot.addEventListener('click', () => {
    getScrollTargets()[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

scroll?.addEventListener('scroll', () => {
  const targets = getScrollTargets();
  const { scrollTop, clientHeight } = scroll;
  let idx = 0;
  for (let i = targets.length - 1; i >= 0; i--) {
    if ((targets[i]?.offsetTop ?? 0) <= scrollTop + clientHeight * 0.5) {
      idx = i;
      break;
    }
  }
  setActive(Math.max(0, Math.min(idx, LABELS.length - 1)));
}, { passive: true });
