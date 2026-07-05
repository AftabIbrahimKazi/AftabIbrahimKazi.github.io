// src/scripts/landing-entry.ts
// Entry point for the landing/nebula page — bootstraps the landing orchestrator.
// Warp transitions are handled globally by WarpRouter (warp-entry.ts).

import { LandingOrchestrator } from './core/landing/LandingOrchestrator';

document.addEventListener('DOMContentLoaded', () => {
  new LandingOrchestrator().init();
});
