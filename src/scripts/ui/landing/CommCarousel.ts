// src/scripts/ui/landing/CommCarousel.ts

import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/css';

const slides   = document.querySelectorAll<HTMLElement>('#lp-comm-swiper .lp-comm-slide');
const thumbs   = document.querySelectorAll<HTMLButtonElement>('.lp-comm-thumb');
const railBadge   = document.getElementById('lp-comm-rail-badge');
const railCounter = document.getElementById('lp-comm-rail-counter');

function syncRail(index: number): void {
  const slide = slides[index];
  if (!slide) return;

  const industryIcon = slide.querySelector('.lp-comm-slide-industry i')?.outerHTML ?? '';
  const industryText = slide.dataset.industry ?? '';
  if (railBadge) railBadge.innerHTML = `${industryIcon} ${industryText}`;
  if (railCounter) railCounter.textContent = `${String(index + 1).padStart(2, '0')} / ${slides.length}`;

  thumbs.forEach(thumb => {
    thumb.dataset.active = String(Number(thumb.dataset.slideIndex) === index);
  });
}

const swiper = new Swiper('#lp-comm-swiper', {
  modules:        [Navigation],
  slidesPerView:  1,
  spaceBetween:   0,
  loop:           false,
  allowTouchMove: true,
  navigation: {
    prevEl: '#lp-comm-prev',
    nextEl: '#lp-comm-next',
  },
  on: {
    slideChange: s => syncRail(s.activeIndex),
  },
});

thumbs.forEach(thumb => {
  thumb.addEventListener('click', () => swiper.slideTo(Number(thumb.dataset.slideIndex)));
});

syncRail(0);
