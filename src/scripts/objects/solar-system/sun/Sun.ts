// src/scripts/objects/solar-system/sun/Sun.ts

import * as THREE from 'three';
import { buildSunSurfaceMaterial } from './SunSurface';

export class Sun {

  readonly mesh!: THREE.Mesh;
  readonly pivot: null = null;
  private scene: THREE.Scene;
  private loader: THREE.TextureLoader;

  constructor(scene: THREE.Scene) {
    this.scene  = scene;
    this.loader = new THREE.TextureLoader();
    this._build();
  }

  private _build(): void {
    const sunColor   = new THREE.Color(0xfff3c4);
    const sunTexture = this.loader.load('/textures/solarsystem/star/sun/sun-texture.avif');
    sunTexture.wrapS = sunTexture.wrapT = THREE.RepeatWrapping;
    sunTexture.colorSpace = THREE.SRGBColorSpace;

    const glowTexture = this.loader.load('/textures/solarsystem/star/sun/radial-glow-5.avif');
    const geometry    = new THREE.SphereGeometry(2, 64, 64);

    const sunSurface = buildSunSurfaceMaterial(sunTexture);

    (this as any).mesh = new THREE.Mesh(geometry, sunSurface.material);
    this.scene.add(this.mesh);
    this.mesh.name = 'ex-sun-js';

    const blurMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: sunColor, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true });
    const sunBlur = new THREE.Sprite(blurMaterial);
    this.mesh.add(sunBlur);

    const haloMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: sunColor, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false });
    const sunHalo = new THREE.Sprite(haloMaterial);
    this.mesh.add(sunHalo);

    const rayMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: sunColor, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false });
    const sunRays = new THREE.Sprite(rayMaterial);
    this.mesh.add(sunRays);

    const sunLight = new THREE.PointLight(0xfff5eb, 50, 200, 1.15);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);

    this.mesh.userData['_sunSurfacePan'] = sunSurface.pan;
    this.mesh.userData['_sunBlur']       = sunBlur;
    this.mesh.userData['_sunHalo']       = sunHalo;
    this.mesh.userData['_sunRays']       = sunRays;
  }

  /** Live UV-offset uniforms for the sun texture â€” keyframe x/y to pan. */
  get surfacePan(): Record<string, number> { return this.mesh.userData['_sunSurfacePan']; }

  get blur(): THREE.Sprite { return this.mesh.userData['_sunBlur']; }
  get halo(): THREE.Sprite { return this.mesh.userData['_sunHalo']; }
  get rays(): THREE.Sprite { return this.mesh.userData['_sunRays']; }
}
