declare module '@strata-packages/offcanvas' {
  interface StrataOffcanvasAPI {
    open(selector: string | HTMLElement): void;
    close(): void;
  }
  const StrataOffcanvas: StrataOffcanvasAPI;
  export default StrataOffcanvas;
}

declare module '@strata-packages/modal' {
  interface StrataModalAPI {
    open(selector: string | HTMLElement): void;
    close(): void;
  }
  const StrataModal: StrataModalAPI;
  export default StrataModal;
}
