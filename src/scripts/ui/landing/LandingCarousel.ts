// src/scripts/ui/landing/LandingCarousel.ts

const carousel = document.getElementById('lp-planet-carousel');
const items    = carousel?.querySelectorAll<HTMLElement>('.lp-planet-item');
const prevBtn  = document.getElementById('lp-prev-btn');
const nextBtn  = document.getElementById('lp-next-btn');

let active = 2; // Earth default

function warpTo(href: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function setActive(idx: number): void {
  if (!items) return;
  items.forEach((el, i) => { el.dataset.active = String(i === idx); });
  active = idx;
  items[idx]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

items?.forEach((item, i) => {
  item.addEventListener('click', () => {
    if (i !== active) { setActive(i); return; }
    const href = item.dataset.href;
    if (href) warpTo(href);
  });
});

const count = items?.length ?? 0;
prevBtn?.addEventListener('click', () => setActive((active - 1 + count) % count));
nextBtn?.addEventListener('click', () => setActive((active + 1) % count));

setActive(active);
