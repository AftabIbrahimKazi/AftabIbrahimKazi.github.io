// src/scripts/objects/solar-system/mercury/Mercury.ts

import * as THREE from 'three';
import { buildMercurySurfaceMaterial } from './MercurySurface';
import { buildMercuryAtmosphereMaterial } from './MercuryAtmosphere';

export class Mercury {

  readonly mesh!: THREE.Mesh;
  readonly pivot!: THREE.Object3D;
  private scene: THREE.Scene;
  private loader: THREE.TextureLoader;

  constructor(scene: THREE.Scene) {
    this.scene  = scene;
    this.loader = new THREE.TextureLoader();
    this._build();
  }

  private _build(): void {
    const pivot = new THREE.Object3D();
    this.scene.add(pivot);
    (this as any).pivot = pivot;

    const geometry       = new THREE.SphereGeometry(0.5, 64, 64);
    const mercuryTexture = this.loader.load('/textures/solarsystem/planets/mercury/mercury-texture.avif');
    mercuryTexture.colorSpace = THREE.SRGBColorSpace;
    mercuryTexture.anisotropy = 16;

    const mercuryMaterial = buildMercurySurfaceMaterial(mercuryTexture);

    (this as any).mesh = new THREE.Mesh(geometry, mercuryMaterial);
    this.mesh.renderOrder = 1;
    this.mesh.position.set(10, 0, 0);
    this.pivot.add(this.mesh);
    this.mesh.name = 'ex-mercury-js';

    const atmosphereGeometry = new THREE.SphereGeometry(0.5015, 64, 64);
    const atmosphereMaterial = buildMercuryAtmosphereMaterial();

    const mercuryAtmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    mercuryAtmosphere.renderOrder = 2;
    mercuryAtmosphere.name = 'ex-mercury-atmosphere-js';
    this.mesh.add(mercuryAtmosphere);

    const glowTexture = this.loader.load('/textures/solarsystem/star/sun/radial-glow-5.avif');
    const mercuryGlowMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: 0xfff5eb, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const mercuryGlow = new THREE.Sprite(mercuryGlowMaterial);
    mercuryGlow.scale.set(1.25, 1.25, 1.25);
    mercuryGlow.renderOrder = 3;
    this.mesh.add(mercuryGlow);
    mercuryGlow.name = 'ex-mercury-glow-js';
  }
}
