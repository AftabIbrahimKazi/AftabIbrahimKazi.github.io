// src/scripts/ui/shared/ThemeToggle.ts
// Wires the light/dark toggle button (#ex-toggle-theme-js) in Main.astro's
// toggle-container. The button's own data-ex-theme drives its sun/moon icon
// swap (main.css); <html>'s data-ex-theme/data-st-theme drive every themed
// token in the project (variables.css) and Strata's own theming. The choice
// is persisted so it survives navigation between planet pages.

const STORAGE_KEY = 'ex-theme';
const THEME_DARK   = 'dark';
const THEME_LIGHT  = 'light';

const button = document.getElementById('ex-toggle-theme-js');
const html   = document.documentElement;

function applyTheme(theme: string): void {
  html.dataset.exTheme = theme;
  html.dataset.stTheme = theme;
  if (button) button.dataset.exTheme = theme;
}

const stored = window.localStorage.getItem(STORAGE_KEY);
if (stored === THEME_DARK || stored === THEME_LIGHT) {
  applyTheme(stored);
}

button?.addEventListener('click', () => {
  const next = html.dataset.exTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
  applyTheme(next);
  window.localStorage.setItem(STORAGE_KEY, next);
});
