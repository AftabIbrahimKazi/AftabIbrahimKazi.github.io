// src/scripts/controllers/solar-system/InteractionController.ts

import * as THREE from 'three';
import { CameraController } from './CameraController';

export class InteractionController {

  private scene:    THREE.Scene;
  private camera:   THREE.PerspectiveCamera;
  private camCtrl:  CameraController;
  private pivotMap: Record<string, THREE.Object3D>;

  private tooltip:       HTMLElement | null = null;
  private tooltipIcon:   HTMLElement | null = null;
  private tooltipLabel:  HTMLElement | null = null;
  private tooltipStatic: HTMLElement | null = null;

  private readonly nameMap: Record<string, string> = {
    'ex-sun-js':     'Sun',
    'ex-mercury-js': 'Mercury',
    'ex-venus-js':   'Venus',
    'ex-earth-js':   'Earth',
    'ex-mars-js':    'Mars',
    'ex-jupiter-js': 'Jupiter',
    'ex-saturn-js':  'Saturn',
    'ex-uranus-js':  'Uranus',
    'ex-neptune-js': 'Neptune',
  };

  private readonly iconMap: Record<string, string> = {
    'ex-sun-js':     '<i class="ex-icon fa-solid fa-sun"></i>',
    'ex-mercury-js': '<i class="ex-icon fa-solid fa-circle-dot"></i>',
    'ex-venus-js':   '<i class="ex-icon fa-solid fa-circle-dot"></i>',
    'ex-earth-js':   '<i class="ex-icon fa-solid fa-circle-dot"></i>',
    'ex-mars-js':    '<i class="ex-icon fa-solid fa-circle-dot"></i>',
    'ex-jupiter-js': '<i class="ex-icon fa-solid fa-circle-dot"></i>',
    'ex-saturn-js':  '<i class="ex-icon fa-solid fa-circle-dot"></i>',
    'ex-uranus-js':  '<i class="ex-icon fa-solid fa-circle-dot"></i>',
    'ex-neptune-js': '<i class="ex-icon fa-solid fa-circle-dot"></i>',
  };

  private readonly staticMap: Record<string, string> = {
    'ex-sun-js':     'Dia: 1,391,000 km | Temp: 5,778 K | Type: G-type star',
    'ex-mercury-js': 'Dia: 4,879 km | Moons: 0 | Orbit: 88 days',
    'ex-venus-js':   'Dia: 12,104 km | Moons: 0 | Orbit: 225 days',
    'ex-earth-js':   'Dia: 12,742 km | Moons: 1 | Orbit: 365 days',
    'ex-mars-js':    'Dia: 6,779 km | Moons: 2 | Orbit: 687 days',
    'ex-jupiter-js': 'Dia: 139,820 km | Moons: 95 | Orbit: 11.9 yrs',
    'ex-saturn-js':  'Dia: 116,460 km | Moons: 146 | Orbit: 29.4 yrs',
    'ex-uranus-js':  'Dia: 50,724 km | Moons: 28 | Orbit: 84 yrs',
    'ex-neptune-js': 'Dia: 49,244 km | Moons: 16 | Orbit: 164.8 yrs',
  };

  private readonly semiMajorAxis: Record<string, number> = {
    'ex-mercury-js': 57_900_000,
    'ex-venus-js':   108_200_000,
    'ex-earth-js':   149_600_000,
    'ex-mars-js':    227_900_000,
    'ex-jupiter-js': 778_500_000,
    'ex-saturn-js':  1_432_000_000,
    'ex-uranus-js':  2_867_000_000,
    'ex-neptune-js': 4_515_000_000,
  };

  private readonly eccentricity: Record<string, number> = {
    'ex-mercury-js': 0.2056,
    'ex-venus-js':   0.0067,
    'ex-earth-js':   0.0167,
    'ex-mars-js':    0.0935,
    'ex-jupiter-js': 0.0489,
    'ex-saturn-js':  0.0565,
    'ex-uranus-js':  0.0457,
    'ex-neptune-js': 0.0113,
  };

  private readonly avgVelocity: Record<string, number> = {
    'ex-mercury-js': 47.4,
    'ex-venus-js':   35.0,
    'ex-earth-js':   29.8,
    'ex-mars-js':    24.1,
    'ex-jupiter-js': 13.1,
    'ex-saturn-js':  9.7,
    'ex-uranus-js':  6.8,
    'ex-neptune-js': 5.4,
  };

  constructor(
    scene:    THREE.Scene,
    camera:   THREE.PerspectiveCamera,
    camCtrl:  CameraController,
    pivotMap: Record<string, THREE.Object3D>
  ) {
    this.scene    = scene;
    this.camera   = camera;
    this.camCtrl  = camCtrl;
    this.pivotMap = pivotMap;
    this._setup();
  }

  // ── Private — Orchestrated Setup ─────────────────────────

  private _setup(): void {
    this._setupTooltip();
    this._bindMouseMove();
    this._bindDoubleClick();
    this._bindCarouselNavigation();
  }

  private _setupTooltip(): void {
    this.tooltip       = document.getElementById('ex-tooltip-ts');
    this.tooltipIcon   = this.tooltip?.querySelector('.ex-tooltip-icon-ts')   as HTMLElement ?? null;
    this.tooltipLabel  = this.tooltip?.querySelector('.ex-tooltip-label-ts')  as HTMLElement ?? null;
    this.tooltipStatic = this.tooltip?.querySelector('.ex-tooltip-static-ts') as HTMLElement ?? null;
  }

  // ── Public API ────────────────────────────────────────────

  updateTooltipLiveData(): void { this._updateTooltipLiveData(); }

  // ── Private — Event Binding ───────────────────────────────

  private _bindMouseMove(): void {
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    window.addEventListener('mousemove', (event) => {
      mouse.x =  (event.clientX / window.innerWidth)  * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.scene.children, true);

      const hit = intersects.find(i => {
        let obj: THREE.Object3D | null = i.object;
        while (obj) { if (this.nameMap[obj.name]) return true; obj = obj.parent; }
        return false;
      });

      if (hit) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj && !this.nameMap[obj.name]) obj = obj.parent;
        const key = obj!.name;

        if (this.tooltipLabel)  this.tooltipLabel.textContent  = this.nameMap[key];
        if (this.tooltipIcon)   this.tooltipIcon.innerHTML     = this.iconMap[key];
        if (this.tooltipStatic) this.tooltipStatic.textContent = this.staticMap[key];

        this.tooltip!.dataset.object       = key;
        this.tooltip!.dataset.tooltipState = 'visible';
        this.tooltip!.style.left = `${event.clientX}px`;
        this.tooltip!.style.top  = `${event.clientY}px`;
        document.body.dataset.cursorState = 'pointer';
      } else {
        this.tooltip!.dataset.tooltipState = 'hidden';
        this.tooltip!.dataset.object       = '';
        document.body.dataset.cursorState = 'default';
      }
    });
  }

  private _bindDoubleClick(): void {
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    window.addEventListener('dblclick', (event) => {
      // Ignore double clicks while overlay is open — two quick swipes can register as dblclick
      const overlayOpen = document.getElementById('ex-content-overlay')?.dataset.overlayState === 'open';
      if (overlayOpen) return;

      mouse.x =  (event.clientX / window.innerWidth)  * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects      = raycaster.intersectObjects(this.scene.children, true);
      const targetIntersect = intersects.find(i => i.object instanceof THREE.Mesh);

      if (targetIntersect) {
        this.camCtrl.focusOnObject(targetIntersect.object);
      } else {
        this.camCtrl.resetCamera();
      }
    });
  }

  private _bindCarouselNavigation(): void {
    window.addEventListener('ct:carousel-navigate', (e: Event) => {
      const { planetKey } = (e as CustomEvent<{ planetKey: string }>).detail;

      // Find the planet mesh in the scene by its name
      const mesh = this.scene.getObjectByName(planetKey);
      if (!mesh) return;

      // isCarousel = true — skips the ct:close-overlay dispatch in CameraController
      // because the overlay is handling its own carousel transition
      this.camCtrl.focusOnObject(mesh, true);
    });
  }

  // ── Private — Live Orbital Data ───────────────────────────

  private _updateTooltipLiveData(): void {
    if (!this.tooltip || this.tooltip.dataset.tooltipState !== 'visible') return;

    const key = this.tooltip.dataset.object;
    if (!key) return;

    const tooltipLive = this.tooltip.querySelector('.ex-tooltip-live-ts') as HTMLElement;
    if (!tooltipLive) return;

    if (key === 'ex-sun-js') { tooltipLive.textContent = ''; return; }

    const pivot = this.pivotMap[key];
    if (!pivot) return;

    const a     = this.semiMajorAxis[key];
    const e     = this.eccentricity[key];
    const angle = ((pivot.rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    const liveDistance = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
    const liveVelocity = this.avgVelocity[key] * Math.sqrt((2 * a) / liveDistance - 1);

    const distFormatted = liveDistance >= 1_000_000_000
      ? `${(liveDistance / 1_000_000_000).toFixed(3)}B km`
      : `${(liveDistance / 1_000_000).toFixed(1)}M km`;

    tooltipLive.textContent = `Dist: ${distFormatted} | Vel: ${liveVelocity.toFixed(2)} km/s`;
  }
}
