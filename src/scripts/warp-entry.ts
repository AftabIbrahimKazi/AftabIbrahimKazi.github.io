// src/scripts/warp-entry.ts
// Imported by every layout. Boots the WarpRouter as early as possible.

import { WarpRouter } from './warp/WarpRouter';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('ex-warp-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;
  WarpRouter.init(canvas);
});
