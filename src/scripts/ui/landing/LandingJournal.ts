// src/scripts/ui/landing/LandingJournal.ts

import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';

new Swiper('#lp-jn-swiper', {
  modules:       [Navigation, Pagination],
  slidesPerView: 1,
  spaceBetween:  16,
  loop:          true,
  breakpoints: {
    768:  { slidesPerView: 3 },
    992:  { slidesPerView: 4 },
  },
  navigation: {
    prevEl: '#lp-jn-prev',
    nextEl: '#lp-jn-next',
  },
  pagination: {
    el:        '#lp-jn-pagination',
    clickable: true,
  },
});
