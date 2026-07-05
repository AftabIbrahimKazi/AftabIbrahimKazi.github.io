// src/scripts/controllers/solar-system/CameraController.ts

import * as THREE        from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap }          from 'gsap';

export class CameraController {

  readonly controls: OrbitControls;

  private camera:   THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private _followTarget:  THREE.Object3D | null = null;
  private _isSwitching:   boolean = false;

  /** Set true by ScrollCameraController to pause planet follow while scroll narrative is active. */
  pauseScrollCamera: boolean = false;

  private _planetBtn:      HTMLElement | null = null;
  private _planetBtnLabel: HTMLElement | null = null;
  private _planetLabelMap: Record<string, string> = {};

  constructor(
    camera:   THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer
  ) {
    this.camera   = camera;
    this.renderer = renderer;
    this.controls = this._setupOrbitControls();
    this._setup();
  }

  private _setup(): void {
    this._setupPlanetButton();
    this._bindSceneModeEvent();
  }

  // ── Public API ────────────────────────────────────────────

  updateFollowTarget(): void { this._updateFollowTarget(); }
  updatePlanetButton(): void { this._updatePlanetButton(); }
  update(): void             { this.controls.update();     }
  resetCamera(): void        { this._resetCamera();        }

  /**
   * isCarousel = true — called from carousel navigation.
   * Skips the ct:close-overlay dispatch and uses a shorter
   * duration to match the overlay slide timing.
   * duration — overrides the default tween length when set.
   */
  focusOnObject(object: THREE.Object3D, isCarousel = false, duration?: number): void {
    this._focusOnObject(object, isCarousel, duration);
  }

  // ── Private — OrbitControls ───────────────────────────────

  private _setupOrbitControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);

    controls.enableDamping  = true;
    controls.dampingFactor  = 0.05;
    controls.minDistance    = 2;
    controls.maxDistance    = 150;

    controls.listenToKeyEvents(window);
    controls.keys = {
      LEFT:   'ArrowLeft',
      UP:     'ArrowUp',
      RIGHT:  'ArrowRight',
      BOTTOM: 'ArrowDown',
    };

    controls.update();
    return controls;
  }

  // ── Private — Camera Transitions ─────────────────────────

  private _focusOnObject(object: THREE.Object3D, isCarousel = false, durationOverride?: number): void {

    // Close any open overlay when switching planets normally.
    // Skipped during carousel — the overlay handles its own transition.
    if (this._followTarget && !isCarousel) {
      window.dispatchEvent(new CustomEvent('ct:close-overlay'));
    }

    // Interrupt any running carousel camera tween — pick up from current position
    if (isCarousel) {
      gsap.killTweensOf(this.camera.position);
      gsap.killTweensOf(this.controls.target);
      this._isSwitching = false;
    }

    let targetObject = object;
    let name         = targetObject.name;

    if (!name.endsWith('-js') && targetObject.parent) {
      targetObject = targetObject.parent;
      name         = targetObject.name;
    }

    const offsetMap: Record<string, { x: number; y: number; z: number }> = {
      'ex-sun-js':     { x: 12,  y: 5,   z: 20 },
      'ex-mercury-js': { x: 2,   y: 0.5, z: 3  },
      'ex-venus-js':   { x: 2.5, y: 0.8, z: 4  },
      'ex-earth-js':   { x: 2.5, y: 0.8, z: 4  },
      'ex-mars-js':    { x: 2,   y: 0.5, z: 3  },
      'ex-jupiter-js': { x: 10,  y: 4,   z: 15 },
      'ex-saturn-js':  { x: 12,  y: 5,   z: 18 },
      'ex-uranus-js':  { x: 5,   y: 2,   z: 8  },
      'ex-neptune-js': { x: 5,   y: 2,   z: 8  },
    };

    // Wider arrival offsets used only for URL-target navigation (durationOverride set).
    const arrivalOffsetMap: Record<string, { x: number; y: number; z: number }> = {
      'ex-sun-js':     { x: 22,  y: 9,   z: 38 },
      'ex-mercury-js': { x: 5,   y: 2,   z: 8  },
      'ex-venus-js':   { x: 6,   y: 2.5, z: 10 },
      'ex-earth-js':   { x: 6,   y: 2.5, z: 10 },
      'ex-mars-js':    { x: 5,   y: 2,   z: 8  },
      'ex-jupiter-js': { x: 20,  y: 8,   z: 30 },
      'ex-saturn-js':  { x: 24,  y: 10,  z: 36 },
      'ex-uranus-js':  { x: 10,  y: 4,   z: 16 },
      'ex-neptune-js': { x: 10,  y: 4,   z: 16 },
    };

    const isAsteroid = name.startsWith('ex-asteroid-');
    const offset     = isAsteroid
      ? { x: 0.5, y: 0.3, z: 1.0 }
      : ((durationOverride ? arrivalOffsetMap[name] : offsetMap[name]) ?? { x: 5, y: 2, z: 10 });

    this._isSwitching  = true;
    this._followTarget = targetObject;
    if (this._planetBtn) this._planetBtn.dataset.btnState = 'hidden';

    const targetPos = new THREE.Vector3();
    targetObject.getWorldPosition(targetPos);

    // Carousel uses a longer smooth duration — camera starts early during drag so it feels natural
    const duration = durationOverride ?? (isCarousel ? 1.8 : 2.0);

    // URL-target arrival uses power2.out: starts at full velocity so dropped frames
    // on slower hardware are imperceptible (large deltas), then decelerates smoothly.
    const ease = durationOverride ? 'power2.out' : (isCarousel ? 'power2.inOut' : 'power3.inOut');

    gsap.to(this.camera.position, {
      x:        targetPos.x + offset.x,
      y:        targetPos.y + offset.y,
      z:        targetPos.z + offset.z,
      duration,
      ease,
      onComplete: () => {
        this._isSwitching = false;
        setTimeout(() => { this._updatePlanetButton(); }, 150);
      },
    });

    gsap.to(this.controls.target, {
      x:        targetPos.x,
      y:        targetPos.y,
      z:        targetPos.z,
      duration,
      ease,
    });
  }

  private _resetCamera(): void {
    this._followTarget = null;
    if (this._planetBtn) this._planetBtn.dataset.btnState = 'hidden';
    window.dispatchEvent(new CustomEvent('ct:scene-mode'));

    gsap.to(this.controls.target, { x: 0, y: 0, z: 0, duration: 1.5, ease: 'power2.inOut' });
    gsap.to(this.camera.position, { x: 20, y: 10, z: 30, duration: 1.5, ease: 'power2.inOut' });
  }

  private _bindSceneModeEvent(): void {
    window.addEventListener('ct:scene-mode', () => {
      if (this._followTarget) this._resetCamera();
    });
  }

  // ── Private — Planet Button ───────────────────────────────

  private _setupPlanetButton(): void {
    const btn      = document.getElementById('ex-planet-btn-ts') as HTMLElement;
    const btnLabel = btn?.querySelector('.ex-planet-btn-label-ts') as HTMLElement;

    this._planetBtn      = btn;
    this._planetBtnLabel = btnLabel;
    this._planetLabelMap = {
      'ex-sun-js':     'Explore Sun',
      'ex-mercury-js': 'Explore Mercury',
      'ex-venus-js':   'Explore Venus',
      'ex-earth-js':   'Explore Earth',
      'ex-mars-js':    'Explore Mars',
      'ex-jupiter-js': 'Explore Jupiter',
      'ex-saturn-js':  'Explore Saturn',
      'ex-uranus-js':  'Explore Uranus',
      'ex-neptune-js': 'Explore Neptune',
    };

    const exploreBtn = btn?.querySelector('.ex-planet-explore-btn') as HTMLElement | null;
    exploreBtn?.addEventListener('click', () => {
      const key = btn.getAttribute('data-object');
      if (!key) return;
      btn.dataset.btnState = 'hidden';
      window.dispatchEvent(
        new CustomEvent<{ planetKey: string }>('ct:explore-mode', { detail: { planetKey: key } })
      );
    });
  }

  private _updatePlanetButton(): void {
    if (!this._planetBtn || !this._followTarget) {
      if (this._planetBtn) this._planetBtn.dataset.btnState = 'hidden';
      return;
    }

    if (this._isSwitching) {
      if (this._planetBtn) this._planetBtn.dataset.btnState = 'hidden';
      return;
    }

    // Hide button while overlay is open — it makes no sense alongside the explore page
    const overlayOpen = document.getElementById('ex-content-overlay')?.dataset.overlayState === 'open';
    if (overlayOpen) {
      this._planetBtn.dataset.btnState = 'hidden';
      return;
    }

    const targetPos = new THREE.Vector3();
    this._followTarget.getWorldPosition(targetPos);

    let obj: THREE.Object3D | null = this._followTarget;
    while (obj && !this._planetLabelMap[obj.name]) obj = obj.parent;
    const key = obj?.name ?? '';

    if (!key) { this._planetBtn.dataset.btnState = 'hidden'; return; }

    const hideThresholdMap: Record<string, number> = {
      'ex-sun-js':     Math.hypot(12, 5, 20)  * 2.0,
      'ex-mercury-js': Math.hypot(2, 5, 3)    * 2.0,
      'ex-venus-js':   Math.hypot(2.5, 5, 4)  * 2.0,
      'ex-earth-js':   Math.hypot(2.5, 5, 4)  * 2.0,
      'ex-mars-js':    Math.hypot(2, 5, 3)    * 2.0,
      'ex-jupiter-js': Math.hypot(10, 7, 15)  * 0.9,
      'ex-saturn-js':  Math.hypot(12, 7, 18)  * 0.85,
      'ex-uranus-js':  Math.hypot(5, 7, 8)    * 1.0,
      'ex-neptune-js': Math.hypot(5, 7, 8)    * 1.0,
    };

    const threshold = hideThresholdMap[key] ?? 60;
    const distance  = this.camera.position.distanceTo(targetPos);

    if (distance > threshold) { this._planetBtn.dataset.btnState = 'hidden'; return; }

    const projected = targetPos.clone().project(this.camera);
    const x = ( projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-projected.y * 0.5 + 0.5) * window.innerHeight;

    this._planetBtnLabel!.textContent = this._planetLabelMap[key];
    this._planetBtn.setAttribute('data-object', key);
    this._planetBtn.style.left = `${x}px`;
    this._planetBtn.style.top  = `${y}px`;
    this._planetBtn.dataset.btnState = 'visible';
  }

  // ── Private — Follow Target ───────────────────────────────

  private _updateFollowTarget(): void {
    if (!this._followTarget || this._isSwitching || this.pauseScrollCamera) return;

    const targetPos = new THREE.Vector3();
    this._followTarget.getWorldPosition(targetPos);

    const delta = new THREE.Vector3().subVectors(targetPos, this.controls.target);
    this.camera.position.lerp(this.camera.position.clone().add(delta), 0.02);
    this.controls.target.lerp(targetPos, 0.02);
    this.controls.update();
  }
}
