// src/scripts/core/solar-system/SolEngine.ts

import * as THREE from 'three';

export class SolEngine {

  readonly scene!:    THREE.Scene;
  readonly camera!:   THREE.PerspectiveCamera;
  readonly renderer!: THREE.WebGLRenderer;

  private _canvas: HTMLCanvasElement | null;
  private _ready:  boolean = false;

  constructor(canvasSelector: string) {
    this._canvas = document.querySelector<HTMLCanvasElement>(canvasSelector);

    if (!this._canvas) return;

    this._setup();
  }

  get isReady(): boolean { return this._ready; }

  private _setup(): void {
    this._setupScene();
    this._setupCamera();
    this._setupRenderer();
    window.addEventListener('resize', this._onWindowResize.bind(this));
    this._ready = true;
  }

  private _setupScene(): void {
    (this as any).scene = new THREE.Scene();
  }

  private _setupCamera(): void {
    const cam = new THREE.PerspectiveCamera(
      20,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cam.position.z = 25;
    (this as any).camera = cam;
  }

  private _setupRenderer(): void {
    const renderer = new THREE.WebGLRenderer({
      canvas:            this._canvas!,
      antialias:         true,
      alpha:             true,
      premultipliedAlpha: false,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    renderer.outputColorSpace    = THREE.SRGBColorSpace;

    (this as any).renderer = renderer;
  }

  private _onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}