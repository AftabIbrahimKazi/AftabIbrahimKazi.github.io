// src/scripts/environment/landing/LandingEnvironment.ts
// Landing-domain scene environment — mirrors the sol-side EnvironmentManager:
// backdrop (procedural nebula sky sphere) + global lighting. The lights were
// previously created inside LandingAsteroids; they are scene-wide and belong
// here (they light the asteroids AND everything else).

import * as THREE from 'three';
import { NebulaScene } from './NebulaScene';

// Sun / ambient tuning (moved from LandingAsteroids — asteroid-settings.json)
const SUN_INT   = 4.5;        // strong sun — space has no atmosphere to soften it
const AMB_INT   = 0.015;      // near-zero ambient — shadows should go very dark
const SUN_H_DEG = 45;
const SUN_V_DEG = 35;         // slightly higher angle for better face coverage
const SUN_COLOR = '#fff6e8';  // warm sunlight

export class LandingEnvironment {

  private scene: THREE.Scene;
  private _nebula!: NebulaScene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  init(): void {
    this._setupBackground();
    this._setupLighting();
  }

  private _setupBackground(): void {
    this._nebula = new NebulaScene(this.scene);
  }

  private _setupLighting(): void {
    const hRad = SUN_H_DEG * (Math.PI / 180);
    const vRad = SUN_V_DEG * (Math.PI / 180);
    const sd   = 500;

    const ambient = new THREE.AmbientLight(0x223355, AMB_INT);  // barely-there deep space blue — shadows stay dark
    const sun     = new THREE.DirectionalLight(new THREE.Color(SUN_COLOR), SUN_INT);
    sun.position.set(
      Math.cos(vRad) * Math.cos(hRad) * sd,
      Math.sin(vRad) * sd,
      Math.cos(vRad) * Math.sin(hRad) * sd,
    );
    this.scene.add(ambient, sun);
  }
}
