// src/scripts/ui/landing/RepoCarousel.ts

import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';

new Swiper('#lp-work-swiper', {
  modules:       [Navigation],
  slidesPerView: 1,
  spaceBetween:  0,
  loop:          false,
  allowTouchMove: true,
  navigation: {
    prevEl: '#lp-work-prev',
    nextEl: '#lp-work-next',
  },
  on: {
    slideChange() {
      // Collapse any expanded slide when swiping away
      document.querySelectorAll<HTMLElement>('.lp-repo-slide[data-expanded="true"]').forEach(slide => {
        slide.dataset.expanded = 'false';
        slide.querySelector<HTMLElement>('.lp-repo-card')?.setAttribute('aria-expanded', 'false');
      });
    },
  },
});

document.querySelectorAll<HTMLElement>('.lp-repo-card:not(.lp-repo-card--static)').forEach(card => {
  card.addEventListener('click', () => {
    const slide = card.closest<HTMLElement>('.lp-repo-slide');
    if (!slide) return;
    const expanded = slide.dataset.expanded === 'true';
    slide.dataset.expanded        = expanded ? 'false' : 'true';
    card.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    const info = slide.querySelector<HTMLElement>('.lp-repo-info');
    const pkgs = slide.querySelector<HTMLElement>('.lp-repo-pkgs');
    if (info) info.setAttribute('aria-hidden', expanded ? 'false' : 'true');
    if (pkgs) pkgs.setAttribute('aria-hidden', expanded ? 'true' : 'false');
  });
});
