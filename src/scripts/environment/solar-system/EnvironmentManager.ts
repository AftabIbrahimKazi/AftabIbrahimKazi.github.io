// src/scripts/environment/solar-system/EnvironmentManager.ts

import * as THREE from 'three';

export class EnvironmentManager {

  private scene:    THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  constructor(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
    this.scene    = scene;
    this.renderer = renderer;
  }

  init(): void {
    this._setupBackground();
    this._setupLighting();
  }

  private _setupBackground(): void {
    this.scene.background = new THREE.Color(0x000008);

    new THREE.TextureLoader().load(
      '/textures/hdr/8k_stars_milky_way.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.mapping    = THREE.EquirectangularReflectionMapping;
        this.scene.background          = tex;
        this.scene.backgroundIntensity = 0.15;
      }
    );
  }

  private _setupLighting(): void {
    const spaceLight = new THREE.AmbientLight(0xffffff, 0.01);
    this.scene.add(spaceLight);
  }
}
