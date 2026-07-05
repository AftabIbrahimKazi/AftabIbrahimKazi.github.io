// src/scripts/core/landing/LandingEngine.ts
// Boots a dedicated Three.js renderer for the nebula landing scene.

import * as THREE from 'three';

export class LandingEngine {

  readonly scene:    THREE.Scene;
  readonly camera:   THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;

  private _canvas: HTMLCanvasElement;
  private _ready = false;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) throw new Error(`LandingEngine: #${canvasId} not found`);
    this._canvas = canvas;

    this.scene    = new THREE.Scene();
    this.camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 3.0; // matches example-space-hdr default
    this.renderer.outputColorSpace    = THREE.SRGBColorSpace;

    window.addEventListener('resize', this._onResize.bind(this));
    this._ready = true;
  }

  get isReady(): boolean { return this._ready; }

  private _onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
