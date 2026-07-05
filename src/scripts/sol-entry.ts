// src/scripts/sol-entry.ts
// Entry point for the sol/planet page — bootstraps the sol orchestrator.
// Warp transitions are handled globally by WarpRouter (warp-entry.ts).

import { SolOrchestrator } from './core/solar-system/SolOrchestrator';

document.addEventListener('DOMContentLoaded', () => {
  new SolOrchestrator().init();
});
