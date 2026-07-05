import StrataOffcanvas from '@strata-packages/offcanvas';

const ATTR_SIDEBAR_POSITION = 'sidebarPosition';

export class JournalSidebarController {
  private readonly sidebarLeft:  HTMLElement;
  private readonly sidebarRight: HTMLElement;
  private readonly contentLeft:  HTMLElement;
  private readonly contentRight: HTMLElement;

  constructor(
    sidebarLeft:  HTMLElement,
    sidebarRight: HTMLElement,
    contentLeft:  HTMLElement,
    contentRight: HTMLElement,
  ) {
    this.sidebarLeft  = sidebarLeft;
    this.sidebarRight = sidebarRight;
    this.contentLeft  = contentLeft;
    this.contentRight = contentRight;
  }

  open(section: HTMLElement, content: string): void {
    const position = section.dataset[ATTR_SIDEBAR_POSITION] ?? 'left';
    if (position === 'left') {
      this.contentRight.innerHTML = content;
      StrataOffcanvas.open(this.sidebarRight);
    } else {
      this.contentLeft.innerHTML = content;
      StrataOffcanvas.open(this.sidebarLeft);
    }
  }

  close(): void {
    StrataOffcanvas.close();
  }
}

// ── Boot ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const sidebarLeft  = document.getElementById('ex-jn-sidebar-left');
  const sidebarRight = document.getElementById('ex-jn-sidebar-right');
  const contentLeft  = document.getElementById('ex-jn-sidebar-content-left');
  const contentRight = document.getElementById('ex-jn-sidebar-content-right');

  if (!sidebarLeft || !sidebarRight || !contentLeft || !contentRight) return;

  const controller = new JournalSidebarController(sidebarLeft, sidebarRight, contentLeft, contentRight);

  document.querySelectorAll<HTMLElement>('[data-sidebar-position]').forEach(section => {
    section.querySelectorAll<HTMLElement>('.ex-jn-card').forEach(card => {
      card.addEventListener('click', () => {
        const title    = card.dataset.articleTitle    ?? '';
        const label    = card.dataset.articleLabel    ?? '';
        const category = card.dataset.articleCategory ?? '';
        const date     = card.dataset.articleDate     ?? '';
        const excerpt  = card.dataset.articleExcerpt  ?? '';
        const href     = card.dataset.articleHref     ?? '#';

        const content = `
          <span class="ex-jn-sidebar-category ex-jn-card-category--${category}">${label}</span>
          <h3 class="ex-jn-sidebar-title">${title}</h3>
          <p class="ex-jn-sidebar-excerpt">${excerpt}</p>
          <time class="ex-jn-sidebar-date">${date}</time>
          <a class="ex-jn-sidebar-link" href="${href}">READ ARTICLE &rarr;</a>
        `;

        controller.open(section, content);
      });
    });
  });
});
