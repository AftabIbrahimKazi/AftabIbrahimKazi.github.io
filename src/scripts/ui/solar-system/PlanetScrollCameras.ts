// src/scripts/ui/solar-system/PlanetScrollCameras.ts
// Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Sun, Mercury, Venus scroll cameras

import * as THREE from 'three';
import { gsap }   from 'gsap';
import { CameraController } from '../../controllers/solar-system/CameraController';

export interface CameraWaypoint {
  at:     number;
  offset: { x: number; y: number; z: number };
  lookAt: { x: number; y: number; z: number };
}

export interface ScrollCameraConfig {
  planetKey:       string;
  waypoints:       CameraWaypoint[];
  /** When false, OrbitControls.enabled is NOT disabled during scroll.
   *  Defaults to true for all planets except Mercury, which preserves
   *  the original MercuryScrollCamera behaviour. */
  disableControls?: boolean;
}

// ── Scroll paths ──────────────────────────────────────────────

export const MERCURY_SCROLL_PATH: ScrollCameraConfig = {
  planetKey:       'ex-mercury-js',
  disableControls: false,
  waypoints: [
    {
      // S1 — The Swift Messenger: standard focus, eye level
      at:     0,
      offset: { x: 2,     y: 0.4,  z: 3.2  },
      lookAt: { x: 0,     y: 0,    z: 0    },
    },
    {
      // S2 — Orbit & Speed: pull back wide, elevated — planet small against stars
      at:     0.10,
      offset: { x: 5,     y: 3.5,  z: 8    },
      lookAt: { x: 0,     y: 0,    z: 0    },
    },
    {
      // S3 — Iron Core: low angle looking up — dramatic underside view
      at:     0.20,
      offset: { x: 1.5,   y: -3,   z: 2.5  },
      lookAt: { x: 0,     y: 0,    z: 0    },
    },
    {
      // S4 — Day & Night: side-on showing terminator line
      at:     0.32,
      offset: { x: -0.5,  y: 0.2,  z: 2.8  },
      lookAt: { x: 0,     y: 0,    z: 0    },
    },
    {
      // S5 — Spin-Orbit: top-down angled — see the orbital plane
      at:     0.44,
      offset: { x: 0.5,   y: 4.5,  z: 2.5  },
      lookAt: { x: 0,     y: 0,    z: 0    },
    },
    {
      // S6 — Caloris Basin: very close, surface-skimming low angle
      at:     0.55,
      offset: { x: 0.8,   y: -1.2, z: 1.6  },
      lookAt: { x: 0,     y: -0.2, z: 0    },
    },
    {
      // S7 — Shrinking Planet: medium elevated — full surface visible
      at:     0.65,
      offset: { x: 2.5,   y: 1.5,  z: 3.5  },
      lookAt: { x: 0,     y: 0,    z: 0    },
    },
    {
      // S8 — Magnetic Field: three-quarter from opposite side
      at:     0.75,
      offset: { x: -2.5,  y: 1,    z: 2.5  },
      lookAt: { x: 0,     y: 0,    z: 0    },
    },
    {
      // S9 — Polar Ice: above looking down at pole
      at:     0.85,
      offset: { x: 0.3,   y: 3.5,  z: 1.2  },
      lookAt: { x: 0,     y: 0,    z: 0    },
    },
    {
      // S10 — Exploration: wide cinematic pull-back
      at:     0.95,
      offset: { x: 7,     y: 2.5,  z: 10   },
      lookAt: { x: 0,     y: 0,    z: 0    },
    },
  ],
};

export const VENUS_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-venus-js',
  waypoints: [
    {
      // S1 — Earth's Twin: standard focus, eye level
      at:     0,
      offset: { x: 2.5,  y: 0.8,  z: 4   },
      lookAt: { x: 0,    y: 0,    z: 0   },
    },
    {
      // S2 — Orbit & Brightness: pull far back, planet small against stars
      at:     0.08,
      offset: { x: 6,    y: 4,    z: 9   },
      lookAt: { x: 0,    y: 0,    z: 0   },
    },
    {
      // S3 — Retrograde: top-down angled — orbital plane visible
      at:     0.17,
      offset: { x: 0.5,  y: 5,    z: 3   },
      lookAt: { x: 0,    y: 0,    z: 0   },
    },
    {
      // S4 — Greenhouse Inferno: side-on, terminator dramatically lit
      at:     0.26,
      offset: { x: -0.5, y: 0.5,  z: 3.5 },
      lookAt: { x: 0,    y: 0,    z: 0   },
    },
    {
      // S5 — Sulfuric Clouds: front-facing, cloud bands fully lit
      at:     0.35,
      offset: { x: 3,    y: 1.5,  z: 4.5 },
      lookAt: { x: 0,    y: 0,    z: 0   },
    },
    {
      // S6 — Volcanoes: surface-skimming low angle
      at:     0.44,
      offset: { x: 0.8,  y: -1.5, z: 2   },
      lookAt: { x: 0,    y: -0.3, z: 0   },
    },
    {
      // S7 — No Plate Tectonics: medium elevated, full disk
      at:     0.53,
      offset: { x: 3,    y: 2.5,  z: 4.5 },
      lookAt: { x: 0,    y: 0,    z: 0   },
    },
    {
      // S8 — Highland Continents: swing to opposite side, elevated
      at:     0.62,
      offset: { x: -3,   y: 2,    z: 3   },
      lookAt: { x: 0,    y: 0,    z: 0   },
    },
    {
      // S9 — Could Have Had Life: three-quarter, brightly lit side
      at:     0.70,
      offset: { x: 2,    y: 0.5,  z: 3.5 },
      lookAt: { x: 0,    y: 0,    z: 0   },
    },
    {
      // S10 — The Atmosphere: side view, hazy limb visible
      at:     0.78,
      offset: { x: -1,   y: 1,    z: 3.5 },
      lookAt: { x: 0,    y: 0,    z: 0   },
    },
    {
      // S11 — Phosphine: close medium, front facing
      at:     0.87,
      offset: { x: 2.5,  y: 0.8,  z: 3.2 },
      lookAt: { x: 0,    y: 0,    z: 0   },
    },
    {
      // S12 — Exploration: wide cinematic pull-back
      at:     0.95,
      offset: { x: 8,    y: 3,    z: 12  },
      lookAt: { x: 0,    y: 0,    z: 0   },
    },
  ],
};

export const EARTH_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-earth-js',
  waypoints: [
    { at: 0,    offset: { x: 2.5,  y: 0.8,  z: 4   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.12, offset: { x: 5,    y: 3,    z: 7   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25, offset: { x: 0.5,  y: 4,    z: 2.5 }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.38, offset: { x: -0.5, y: 0.5,  z: 3.5 }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50, offset: { x: 3,    y: 1.5,  z: 4.5 }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.62, offset: { x: 0.8,  y: -1.5, z: 2   }, lookAt: { x: 0, y: -0.3, z: 0 } },
    { at: 0.75, offset: { x: -2.5, y: 1,    z: 3   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.92, offset: { x: 7,    y: 3,    z: 10  }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const MARS_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-mars-js',
  waypoints: [
    { at: 0,    offset: { x: 2,    y: 0.5,  z: 3   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.12, offset: { x: 4.5,  y: 3,    z: 6   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25, offset: { x: 0.5,  y: 4,    z: 2.5 }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.38, offset: { x: -0.5, y: 0.3,  z: 3   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50, offset: { x: 3,    y: 1.5,  z: 4   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.62, offset: { x: 0.8,  y: -1.2, z: 1.8 }, lookAt: { x: 0, y: -0.2, z: 0 } },
    { at: 0.75, offset: { x: -2,   y: 1,    z: 2.5 }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.92, offset: { x: 6,    y: 2.5,  z: 9   }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const JUPITER_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-jupiter-js',
  waypoints: [
    { at: 0,    offset: { x: 10,   y: 4,    z: 15  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.12, offset: { x: 18,   y: 8,    z: 25  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25, offset: { x: 2,    y: 12,   z: 10  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.38, offset: { x: -2,   y: 1,    z: 12  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50, offset: { x: 8,    y: -4,   z: 10  }, lookAt: { x: 0, y: -1, z: 0 } },
    { at: 0.62, offset: { x: -12,  y: 5,    z: 14  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.75, offset: { x: 5,    y: 2,    z: 14  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.92, offset: { x: 22,   y: 8,    z: 32  }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const SATURN_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-saturn-js',
  waypoints: [
    { at: 0,    offset: { x: 12,   y: 5,    z: 18  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.12, offset: { x: 20,   y: 8,    z: 28  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25, offset: { x: 0,    y: 16,   z: 8   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.38, offset: { x: -4,   y: 1,    z: 16  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50, offset: { x: 10,   y: 3,    z: 16  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.62, offset: { x: 14,   y: -3,   z: 12  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.75, offset: { x: -14,  y: 4,    z: 14  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.92, offset: { x: 24,   y: 10,   z: 35  }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const URANUS_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-uranus-js',
  waypoints: [
    { at: 0,    offset: { x: 5,    y: 2,    z: 8   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.12, offset: { x: 9,    y: 5,    z: 14  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25, offset: { x: 0,    y: 9,    z: 5   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.38, offset: { x: 5,    y: -3,   z: 6   }, lookAt: { x: 0, y: -0.5, z: 0 } },
    { at: 0.50, offset: { x: -5,   y: 1,    z: 7   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.62, offset: { x: 4,    y: 3,    z: 7   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.75, offset: { x: -3,   y: 4,    z: 6   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.92, offset: { x: 12,   y: 5,    z: 18  }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const NEPTUNE_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-neptune-js',
  waypoints: [
    { at: 0,    offset: { x: 5,    y: 2,    z: 8   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.12, offset: { x: 10,   y: 5,    z: 15  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25, offset: { x: 0.5,  y: -3,   z: 6   }, lookAt: { x: 0, y: -0.3, z: 0 } },
    { at: 0.38, offset: { x: -1,   y: 0.5,  z: 7   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50, offset: { x: 4,    y: 1.5,  z: 7   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.62, offset: { x: 0.5,  y: 5,    z: 4   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.75, offset: { x: -4,   y: 1,    z: 5   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.92, offset: { x: 13,   y: 5,    z: 20  }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const SUN_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-sun-js',
  waypoints: [
    { at: 0,    offset: { x: 12,   y: 5,    z: 20  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.12, offset: { x: 5,    y: 3,    z: 12  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25, offset: { x: 15,   y: -3,   z: 15  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.38, offset: { x: -8,   y: 4,    z: 14  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50, offset: { x: 0,    y: 14,   z: 10  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.62, offset: { x: 10,   y: 2,    z: 14  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.75, offset: { x: -10,  y: 5,    z: 15  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.92, offset: { x: 25,   y: 10,   z: 38  }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

// ── Generic ScrollCamera class ────────────────────────────────
// All planets use this single class with their respective config

export class PlanetScrollCamera {

  private camera:           THREE.PerspectiveCamera;
  private camCtrl:          CameraController;
  private scene:            THREE.Scene;
  private overlay:          HTMLElement | null = null;

  private _active:          boolean = false;
  private _config:          ScrollCameraConfig | null = null;
  private _currentProgress: number  = 0;

  private _targetPos:    THREE.Vector3 = new THREE.Vector3();
  private _targetLookAt: THREE.Vector3 = new THREE.Vector3();

  // Pre-allocated — reused every frame in _computeTargets to avoid GC pressure
  private _planetPos: THREE.Vector3 = new THREE.Vector3();

  // Tracks whether activate() disabled controls so deactivate() only re-enables if it did
  private _controlsDisabled: boolean = false;

  private static readonly LERP_SPEED = 0.04;

  constructor(
    camera:  THREE.PerspectiveCamera,
    camCtrl: CameraController,
    scene:   THREE.Scene
  ) {
    this.camera  = camera;
    this.camCtrl = camCtrl;
    this.scene   = scene;
  }

  activate(config: ScrollCameraConfig): void {
    if (this._active) this.deactivate();
    this._active          = true;
    this._config          = config;
    this.overlay          = document.getElementById('ex-content-overlay');
    this._currentProgress = 0;
    this._targetPos.copy(this.camera.position);
    this._targetLookAt.copy(this.camCtrl.controls.target);

    // Pause planet follow and disable OrbitControls damping
    // Damping applies residual velocity that fights the lerp — causes jank
    this.camCtrl.controls.enableDamping = false;
    this.camCtrl.pauseScrollCamera      = true;

    // Mercury preserves controls.enabled — only disable when config says so (default: true)
    this._controlsDisabled = config.disableControls !== false;
    if (this._controlsDisabled) {
      this.camCtrl.controls.enabled = false;
    }
    this.overlay?.addEventListener('scroll', this._onScroll, { passive: true });
    window.addEventListener('ct:scroll-past-exit', this._onScrollPastExit);
    this._computeTargets(0);
  }

  /**
   * @param silent  When true (carousel navigation) — stops the lerp and
   *                restores controls immediately without tweening the camera
   *                back to the entry waypoint.  This leaves the camera exactly
   *                where it is so the incoming focusOnObject tween can start
   *                uncontested from the current position.
   *
   *                When false (default — close / scroll-past-exit) — tweens
   *                the camera back to the planet entry position before handing
   *                control back, giving the cinematic settle-back feel.
   */
  deactivate(silent = false): void {
    if (!this._active) return;
    this._active = false;
    this.overlay?.removeEventListener('scroll', this._onScroll);
    window.removeEventListener('ct:scroll-past-exit', this._onScrollPastExit);

    const config     = this._config;
    const planetMesh = config ? this.scene.getObjectByName(config.planetKey) : null;
    const planetPos  = new THREE.Vector3();
    if (planetMesh) planetMesh.getWorldPosition(planetPos);

    this.overlay = null;
    this._config = null;

    if (silent) {
      // Free the camera immediately — no return tween — so the incoming
      // focusOnObject carousel tween runs uncontested from current position.
      if (this._controlsDisabled) this.camCtrl.controls.enabled = true;
      this.camCtrl.controls.enableDamping = true;
      this.camCtrl.controls.update();
      this.camCtrl.pauseScrollCamera      = false;
      return;
    }

    const entry = config?.waypoints[0];
    if (entry && planetMesh) {
      gsap.to(this.camera.position, {
        x: planetPos.x + entry.offset.x, y: planetPos.y + entry.offset.y, z: planetPos.z + entry.offset.z,
        duration: 1.4, ease: 'power3.inOut',
        onComplete: () => {
          // Re-enable controls only after camera has settled at focus position
          if (this._controlsDisabled) this.camCtrl.controls.enabled = true;
          this.camCtrl.controls.enableDamping = true;
          this.camCtrl.controls.update();
          this.camCtrl.pauseScrollCamera      = false;
        },
      });
      gsap.to(this.camCtrl.controls.target, {
        x: planetPos.x + entry.lookAt.x, y: planetPos.y + entry.lookAt.y, z: planetPos.z + entry.lookAt.z,
        duration: 1.4, ease: 'power3.inOut',
      });
    } else {
      if (this._controlsDisabled) this.camCtrl.controls.enabled = true;
      this.camCtrl.controls.enableDamping = true;
      this.camCtrl.controls.update();
      this.camCtrl.pauseScrollCamera      = false;
    }
  }

  update(): void {
    if (!this._active) return;
    this._computeTargets(this._currentProgress);
    const posDist    = this.camera.position.distanceTo(this._targetPos);
    const targetDist = this.camCtrl.controls.target.distanceTo(this._targetLookAt);
    if (posDist    < 0.001) { this.camera.position.copy(this._targetPos); }
    else                    { this.camera.position.lerp(this._targetPos, PlanetScrollCamera.LERP_SPEED); }
    if (targetDist < 0.001) { this.camCtrl.controls.target.copy(this._targetLookAt); }
    else                    { this.camCtrl.controls.target.lerp(this._targetLookAt, PlanetScrollCamera.LERP_SPEED); }
    this.camera.lookAt(this.camCtrl.controls.target);
  }

  get isActive(): boolean { return this._active; }

  private _onScroll = (): void => {
    if (!this._active || !this._config || !this.overlay) return;
    const scrollTop    = this.overlay.scrollTop;
    const scrollHeight = this.overlay.scrollHeight - this.overlay.clientHeight;
    if (scrollHeight <= 0) return;
    this._currentProgress = Math.min(scrollTop / scrollHeight, 1);
  };

  private _onScrollPastExit = (): void => { this.deactivate(); };

  private _computeTargets(progress: number): void {
    if (!this._config) return;
    const waypoints  = this._config.waypoints;
    const planetMesh = this.scene.getObjectByName(this._config.planetKey);

    // Reuse pre-allocated vector — avoids GC pressure from per-frame allocation
    this._planetPos.set(0, 0, 0);
    if (planetMesh) planetMesh.getWorldPosition(this._planetPos);
    const planetPos = this._planetPos;

    let fromIdx = 0, toIdx = 1;
    for (let i = 0; i < waypoints.length - 1; i++) {
      if (progress <= waypoints[i + 1].at) { fromIdx = i; toIdx = i + 1; break; }
      fromIdx = waypoints.length - 2; toIdx = waypoints.length - 1;
    }

    const from  = waypoints[fromIdx];
    const to    = waypoints[toIdx];
    const span  = to.at - from.at;
    const local = span > 0 ? Math.min((progress - from.at) / span, 1) : 1;
    const t     = local < 0.5 ? 2 * local * local : -1 + (4 - 2 * local) * local;

    this._targetPos.set(
      planetPos.x + from.offset.x + (to.offset.x - from.offset.x) * t,
      planetPos.y + from.offset.y + (to.offset.y - from.offset.y) * t,
      planetPos.z + from.offset.z + (to.offset.z - from.offset.z) * t,
    );
    this._targetLookAt.set(
      planetPos.x + from.lookAt.x + (to.lookAt.x - from.lookAt.x) * t,
      planetPos.y + from.lookAt.y + (to.lookAt.y - from.lookAt.y) * t,
      planetPos.z + from.lookAt.z + (to.lookAt.z - from.lookAt.z) * t,
    );
  }
}
