// src/scripts/controllers/landing/LandingScrollCamera.ts
// Rotates the camera look direction through the nebula sky sphere as user scrolls.
// Camera stays at origin (centre of sphere) — only yaw and pitch change.

import * as THREE from 'three';

interface Waypoint {
  progress: number;
  yaw:   number; // horizontal angle in radians
  pitch: number; // vertical angle in radians
}

// 4 waypoints — one per content beat.
// Slow arc across the sky so the nebula feels explored, not static.
const WAYPOINTS: Waypoint[] = [
  { progress: 0.00, yaw:  0.00,  pitch:  0.05  }, // Beat 01 — straight ahead
  { progress: 0.33, yaw: -0.30,  pitch:  0.18  }, // Beat 02 — drift left, look slightly up
  { progress: 0.66, yaw:  0.20,  pitch: -0.10  }, // Beat 03 — drift right, look slightly down
  { progress: 1.00, yaw:  0.05,  pitch:  0.08  }, // Beat 04 — settle near centre for CTA
];

export class LandingScrollCamera {

  private _camera:       THREE.PerspectiveCamera;
  private _targetYaw:   number = WAYPOINTS[0].yaw;
  private _targetPitch: number = WAYPOINTS[0].pitch;
  private _currentYaw:  number = WAYPOINTS[0].yaw;
  private _currentPitch:number = WAYPOINTS[0].pitch;

  constructor(camera: THREE.PerspectiveCamera) {
    this._camera = camera;
    // Park camera at origin, pointing forward
    this._camera.position.set(0, 0, 0.001);
    this._apply(WAYPOINTS[0].yaw, WAYPOINTS[0].pitch);
  }

  init(): void {
    const scrollContainer = document.getElementById('lp-scroll-container');
    if (!scrollContainer) return;

    scrollContainer.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const max = scrollHeight - clientHeight;
      this.setProgress(max > 0 ? Math.min(scrollTop / max, 1) : 0);
    }, { passive: true });
  }

  setProgress(p: number): void {
    let from = WAYPOINTS[0];
    let to   = WAYPOINTS[WAYPOINTS.length - 1];

    for (let i = 0; i < WAYPOINTS.length - 1; i++) {
      if (p <= WAYPOINTS[i + 1].progress) {
        from = WAYPOINTS[i];
        to   = WAYPOINTS[i + 1];
        break;
      }
    }

    const span  = to.progress - from.progress;
    const local = span > 0 ? (p - from.progress) / span : 1;
    const t     = local < 0.5 ? 2 * local * local : -1 + (4 - 2 * local) * local;

    this._targetYaw   = from.yaw   + (to.yaw   - from.yaw)   * t;
    this._targetPitch = from.pitch + (to.pitch  - from.pitch) * t;
  }

  update(): void {
    this._currentYaw   += (this._targetYaw   - this._currentYaw)   * 0.04;
    this._currentPitch += (this._targetPitch - this._currentPitch)  * 0.04;
    this._apply(this._currentYaw, this._currentPitch);
  }

  private _apply(yaw: number, pitch: number): void {
    const x = Math.sin(yaw)   * Math.cos(pitch);
    const y = Math.sin(pitch);
    const z = -Math.cos(yaw)  * Math.cos(pitch);
    this._camera.lookAt(x, y, z);
  }
}
