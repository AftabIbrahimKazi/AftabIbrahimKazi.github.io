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
  // Same full 0°→360° orbit as before, radius breathes inward toward the
  // middle of the scroll (R=5 at start/end, R=1.8 at the halfway point) for
  // a much more immersive close pass, while still tracing one continuous
  // circular path start to end.
  //
  // lookAt is also nudged off-center during the close waypoints — offset
  // along each waypoint's own camera-right vector (derived from its orbit
  // angle: right = (z/R, 0, -x/R)), scaled by the same sin(pi*t) profile as
  // the radius dip (0 at the wide entry/exit shots, max at S6). This aims
  // the camera slightly past the planet on its right side, which reads on
  // screen as the planet drifting left — clearing the right side of the
  // frame for the right-aligned content cards without moving the orbit path.
  waypoints: [
    {
      // S1 — Journal intro: 0° — R5, no lookAt shift (entry framing, unchanged)
      at:     0,
      offset: { x: 0,     y: 0.0,  z: 5.0    },
      lookAt: { x: 0,     y: 0,    z: 0      },
    },
    {
      // S2 — Article 1: 36° — R4.011
      at:     0.10,
      offset: { x: 2.357, y: 0.0,  z: 3.245  },
      lookAt: { x: 0.150, y: 0,    z: -0.109 },
    },
    {
      // S3 — Article 2: 72° — R3.118
      at:     0.20,
      offset: { x: 2.966, y: 0.0,  z: 0.964  },
      lookAt: { x: 0.109, y: 0,    z: -0.336 },
    },
    {
      // S4 — Article 3: 108° — R2.412
      at:     0.30,
      offset: { x: 2.294, y: 0.0,  z: -0.745 },
      lookAt: { x: -0.150, y: 0,   z: -0.462 },
    },
    {
      // S5 — Article 4: 144° — R1.957
      at:     0.40,
      offset: { x: 1.150, y: 0.0,  z: -1.583 },
      lookAt: { x: -0.462, y: 0,   z: -0.336 },
    },
    {
      // S6 — Topics: 180° — R1.8, closest point of the orbit — immersive close pass,
      // largest lookAt shift so the planet clears the right-aligned cards
      at:     0.50,
      offset: { x: 0,     y: 0.0,  z: -1.8   },
      lookAt: { x: -0.6,  y: 0,    z: 0      },
    },
    {
      // S7 — Writing philosophy: 216° — R1.957
      at:     0.60,
      offset: { x: -1.150, y: 0.0, z: -1.583 },
      lookAt: { x: -0.462, y: 0,   z: 0.336  },
    },
    {
      // S8 — Archive stats: 252° — R2.412
      at:     0.70,
      offset: { x: -2.294, y: 0.0, z: -0.745 },
      lookAt: { x: -0.150, y: 0,   z: 0.462  },
    },
    {
      // S9 — Newsletter: 288° — R3.118
      at:     0.80,
      offset: { x: -2.966, y: 0.0, z: 0.964  },
      lookAt: { x: 0.109,  y: 0,   z: 0.336  },
    },
    {
      // S10 — Navigate: 324° — R4.011
      at:     0.90,
      offset: { x: -2.357, y: 0.0, z: 3.245  },
      lookAt: { x: 0.150,  y: 0,   z: 0.109  },
    },
    {
      // Full circle closes exactly back at the S1 start point — R5, no lookAt shift
      at:     1.00,
      offset: { x: 0,     y: 0.0,  z: 5.0    },
      lookAt: { x: 0,     y: 0,    z: 0      },
    },
  ],
};

export const VENUS_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-venus-js',
  // Same continuous 0°→360° circular-orbit pattern as MERCURY_SCROLL_PATH
  // above (see that config's comment for the derivation): radius breathes
  // from R5 at the wide entry/exit shots to R1.85 at the halfway close pass,
  // and lookAt shifts along each waypoint's camera-right vector (scaled by
  // the same sin(pi*t) profile as the radius dip). 9 sections → 9 evenly-
  // spaced waypoints (t step 1/9) plus a final closing waypoint back at the
  // S1 start framing.
  //
  // Every section from S2 onward has its content right-aligned or centered
  // (see venus-overlay.css layout rules), so a single positive-signed
  // amplitude throughout (planet drifting left) clears all of them without
  // ever flipping direction — except S1, whose intro copy is left-aligned.
  // S1/close get a small negative-signed nudge (planet drifts right instead)
  // to clear that one left-aligned block; the sign change happens smoothly
  // through zero across the S1→S2 and S9→close spans, so the orbit never
  // snaps.
  waypoints: [
    {
      // S1 — Intro: 0° — R5, small negative shift — clears the left-aligned
      // intro copy by drifting the planet slightly right
      at:     0,
      offset: { x: 1.75,      y: 0.0, z: 5.0    },
      lookAt: { x: 0,  y: 0,   z: 0      },
    },
    {
      // S2 — Coverflow overview: 40° — R3.906
      at:     0.1,
      offset: { x: 1.75,      y: 0.0, z: 1.75    },
      lookAt: { x: 0,  y: 0,   z: 1.75      },
    },
    {
      // S3 — Project 1 (Lumen): 80° — R2.943
      at:     0.2,
      offset: { x: 0,      y: 0.0, z: 5.0    },
      lookAt: { x: 0.0,  y: 0,   z: 0      },
    },
    {
      // S4 — Project 2 (Solstice): 120° — R2.229
      at:     0.3,
      offset: { x: 0.0,  y: 0.0, z: 0.0 },
      lookAt: { x: 0.0, y: 0,   z: 0.0 },
    },
    {
      // S5 — Project 3 (Nimbus): 160° — R1.849, close pass
      at:     0.4,
      offset: { x: 0.0,  y: 5, z: 5 },
      lookAt: { x: 0.0, y: 0,   z: 5.0 },
    },
    {
      // S6 — Project 4 (Aurora): 200° — R1.849, close pass
      at:     0.5,
      offset: { x: 0, y: 0, z: 5 },
      lookAt: { x: -0.75, y: 0,   z: 0.0  },
    },
    {
      // S7 — Project 5 (Kinetic): 240° — R2.229
      at:     0.6,
      offset: { x: 0, y: 5, z: 5 },
      lookAt: { x: -1.15, y: 0,   z: 0.5  },
    },
    {
      // S8 — Navigate: 280° — R2.943
      at:     0.7,
      offset: { x: 5, y: 5, z: 5  },
      lookAt: { x: -0.25,  y: 0,   z: 0.25  },
    },
    {
      // S9 — Closing CTA: 320° — R3.906
      at:     0.8,
      offset: { x: 0, y: 5, z: 5 },
      lookAt: { x: -1.5,  y: 0,   z: 0.5  },
    },
    {
      // Full circle closes exactly back at the S1 start framing — R5, same
      // small negative shift as S1
      at:     1.0,
      offset: { x: 0,      y: 0.0, z: 5.0    },
      lookAt: { x: 0.0,  y: 0,   z: 0      },
    },
  ],
};

export const EARTH_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-earth-js',
  // Same continuous circular-orbit pattern as SUN_SCROLL_PATH (see that
  // config's comment) — no lookAt shift (Earth's 8 sections, like Sun's,
  // don't share a single content alignment), radius scaled for Earth's
  // radius-0.9 sphere: R breathes from 3.5 (wide) to 1.6 (close pass at t=0.5).
  waypoints: [
    { at: 0,     offset: { x: 0,      y: 0.6, z: 3.5    }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.125, offset: { x: 1.933,  y: 0.6, z: 1.933  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25,  offset: { x: 2.086,  y: 0.6, z: 0        }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.375, offset: { x: 1.168,  y: 0.6, z: -1.168  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50,  offset: { x: 0,      y: 0.6, z: -1.6     }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.625, offset: { x: -1.168, y: 0.6, z: -1.168  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.75,  offset: { x: -2.086, y: 0.6, z: 0        }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.875, offset: { x: -1.933, y: 0.6, z: 1.933   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 1.00,  offset: { x: 0,      y: 0.6, z: 3.5      }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const MARS_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-mars-js',
  // Same continuous circular-orbit pattern as SUN_SCROLL_PATH/EARTH_SCROLL_PATH
  // (see SUN_SCROLL_PATH's comment) — no lookAt shift, radius scaled for
  // Mars's radius-0.7 sphere: R breathes from 2.8 (wide) to 1.3 (close pass).
  waypoints: [
    { at: 0,     offset: { x: 0,      y: 0.5, z: 2.8    }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.125, offset: { x: 1.545,  y: 0.5, z: 1.545  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25,  offset: { x: 1.669,  y: 0.5, z: 0       }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.375, offset: { x: 0.934,  y: 0.5, z: -0.934 }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50,  offset: { x: 0,      y: 0.5, z: -1.3    }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.625, offset: { x: -0.934, y: 0.5, z: -0.934 }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.75,  offset: { x: -1.669, y: 0.5, z: 0       }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.875, offset: { x: -1.545, y: 0.5, z: 1.545  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 1.00,  offset: { x: 0,      y: 0.5, z: 2.8      }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const JUPITER_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-jupiter-js',
  // Same continuous circular-orbit pattern as SUN_SCROLL_PATH (see that
  // config's comment) — no lookAt shift, radius scaled for Jupiter's
  // radius-1.5 sphere: R breathes from 6 (wide) to 2.7 (close pass).
  waypoints: [
    { at: 0,     offset: { x: 0,      y: 1.2, z: 6      }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.125, offset: { x: 3.315,  y: 1.2, z: 3.315  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25,  offset: { x: 3.578,  y: 1.2, z: 0        }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.375, offset: { x: 2.003,  y: 1.2, z: -2.003  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50,  offset: { x: 0,      y: 1.2, z: -2.7     }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.625, offset: { x: -2.003, y: 1.2, z: -2.003  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.75,  offset: { x: -3.578, y: 1.2, z: 0        }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.875, offset: { x: -3.315, y: 1.2, z: 3.315   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 1.00,  offset: { x: 0,      y: 1.2, z: 6         }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const SATURN_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-saturn-js',
  // Same continuous circular-orbit pattern as SUN_SCROLL_PATH (see that
  // config's comment) — no lookAt shift, radius scaled to clear Saturn's
  // radius-1.25 sphere plus its ring (extends well past the sphere):
  // R breathes from 6.5 (wide) to 3.5 (close pass, still outside the ring).
  waypoints: [
    { at: 0,     offset: { x: 0,      y: 1.6, z: 6.5    }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.125, offset: { x: 3.591,  y: 1.6, z: 3.591  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25,  offset: { x: 3.876,  y: 1.6, z: 0        }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.375, offset: { x: 2.170,  y: 1.6, z: -2.170  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50,  offset: { x: 0,      y: 1.6, z: -3.5     }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.625, offset: { x: -2.170, y: 1.6, z: -2.170  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.75,  offset: { x: -3.876, y: 1.6, z: 0        }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.875, offset: { x: -3.591, y: 1.6, z: 3.591   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 1.00,  offset: { x: 0,      y: 1.6, z: 6.5       }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const URANUS_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-uranus-js',
  // Same continuous circular-orbit pattern as SUN_SCROLL_PATH (see that
  // config's comment) — no lookAt shift, radius scaled for Uranus's
  // radius-0.545 sphere: R breathes from 2.4 (wide) to 1.1 (close pass).
  waypoints: [
    { at: 0,     offset: { x: 0,      y: 0.5, z: 2.4    }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.125, offset: { x: 1.325,  y: 0.5, z: 1.325  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25,  offset: { x: 1.430,  y: 0.5, z: 0        }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.375, offset: { x: 0.801,  y: 0.5, z: -0.801  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50,  offset: { x: 0,      y: 0.5, z: -1.1     }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.625, offset: { x: -0.801, y: 0.5, z: -0.801  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.75,  offset: { x: -1.430, y: 0.5, z: 0        }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.875, offset: { x: -1.325, y: 0.5, z: 1.325   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 1.00,  offset: { x: 0,      y: 0.5, z: 2.4       }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const NEPTUNE_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-neptune-js',
  // Same continuous circular-orbit pattern as SUN_SCROLL_PATH (see that
  // config's comment) — no lookAt shift, radius scaled for Neptune's
  // radius-0.528 sphere: R breathes from 2.3 (wide) to 1.1 (close pass).
  // Only 5 sections (vs. 8 elsewhere — Neptune is a short contact page),
  // so waypoints step by t = 1/5 instead of 1/8.
  waypoints: [
    // R = 2.3 − 1.2·sin(πt), angle = 360°·t
    { at: 0,   offset: { x: 0,      y: 0.4, z: 2.3     }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.2, offset: { x: 1.516,  y: 0.4, z: 0.493   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.4, offset: { x: 0.681,  y: 0.4, z: -0.938  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.6, offset: { x: -0.681, y: 0.4, z: -0.938  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.8, offset: { x: -1.516, y: 0.4, z: 0.493   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 1.0, offset: { x: 0,      y: 0.4, z: 2.3     }, lookAt: { x: 0, y: 0, z: 0 } },
  ],
};

export const SUN_SCROLL_PATH: ScrollCameraConfig = {
  planetKey: 'ex-sun-js',
  // Same continuous circular-orbit pattern as MERCURY_SCROLL_PATH/VENUS_SCROLL_PATH
  // (see MERCURY_SCROLL_PATH's comment for the derivation), scaled up for the
  // Sun's radius-2 sphere (vs. 0.5-0.8 for the rocky planets): radius breathes
  // from R14 at the wide entry/exit shots to R6 at the halfway close pass.
  // Sun's 8 sections alternate left/right/center content placement (unlike
  // Mercury/Venus's single right-aligned convention), so no per-waypoint
  // lookAt shift is applied here — a plain centered orbit, one continuous
  // circle, 8 evenly-spaced waypoints (t step 1/8) plus a closing waypoint
  // back at the S1 start framing.
  waypoints: [
    // R = 14 − 8·sin(πt), angle = 360°·t — R14 wide shot down to R6 close pass at t=0.5
    { at: 0,     offset: { x: 0,      y: 3, z: 14      }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.125, offset: { x: 7.735,  y: 3, z: 7.735   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.25,  offset: { x: 8.343,  y: 3, z: 0        }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.375, offset: { x: 4.673,  y: 3, z: -4.673  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.50,  offset: { x: 0,      y: 3, z: -6       }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.625, offset: { x: -4.673, y: 3, z: -4.673  }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.75,  offset: { x: -8.343, y: 3, z: 0        }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 0.875, offset: { x: -7.735, y: 3, z: 7.735   }, lookAt: { x: 0, y: 0, z: 0 } },
    { at: 1.00,  offset: { x: 0,      y: 3, z: 14       }, lookAt: { x: 0, y: 0, z: 0 } },
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
