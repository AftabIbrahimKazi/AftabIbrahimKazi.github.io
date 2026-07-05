// src/scripts/objects/solar-system/jupiter/Jupiter.ts

import * as THREE from 'three';
import { buildJupiterSurfaceMaterial } from './JupiterSurface';
import { buildJupiterCloudMaterial } from './JupiterClouds';
import { buildJupiterAtmosphereMaterial } from './JupiterAtmosphere';

export class Jupiter {

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

    const geometry       = new THREE.SphereGeometry(1.5, 64, 64);
    const jupiterTexture = this.loader.load('/textures/solarsystem/planets/jupiter/8k_jupiter.jpg');
    jupiterTexture.colorSpace = THREE.SRGBColorSpace;
    jupiterTexture.anisotropy = 16;
    jupiterTexture.wrapS = jupiterTexture.wrapT = THREE.RepeatWrapping;

    const jupiterSurface = buildJupiterSurfaceMaterial(jupiterTexture);

    (this as any).mesh = new THREE.Mesh(geometry, jupiterSurface.material);
    this.mesh.renderOrder = 1;
    this.mesh.position.set(65, 0, 0);
    this.pivot.add(this.mesh);
    this.mesh.name = 'ex-jupiter-js';

    const cloudGeometry = new THREE.SphereGeometry(1.5015, 64, 64);
    const cloudTexture  = this.loader.load('/textures/solarsystem/planets/jupiter/8k_jupiter.jpg');
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.anisotropy = 16;
    cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;

    const jupiterClouds = buildJupiterCloudMaterial(cloudTexture);

    const jupiterCloud = new THREE.Mesh(cloudGeometry, jupiterClouds.material);
    jupiterCloud.renderOrder = 2;
    jupiterCloud.name = 'ex-jupiter-cloud-js';
    this.mesh.add(jupiterCloud);

    const atmosphereGeometry = new THREE.SphereGeometry(1.505, 64, 64);
    const atmosphereMaterial = buildJupiterAtmosphereMaterial();

    const jupiterAtmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    jupiterAtmosphere.renderOrder = 3;
    jupiterAtmosphere.name = 'ex-jupiter-atmosphere-js';
    this.mesh.add(jupiterAtmosphere);

    const glowTexture = this.loader.load('/textures/solarsystem/star/sun/radial-glow-5.png');
    const jupiterGlowMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: 0x8a6040, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const jupiterGlow = new THREE.Sprite(jupiterGlowMaterial);
    jupiterGlow.scale.set(5.0, 5.0, 5.0);
    jupiterGlow.renderOrder = 4;
    this.mesh.add(jupiterGlow);
    jupiterGlow.name = 'ex-jupiter-glow-js';

    this.mesh.userData['_jupiterSurfacePan'] = jupiterSurface.pan;
    this.mesh.userData['_jupiterCloudPan']   = jupiterClouds.pan;
  }

  /** Live UV-offset uniforms for the surface texture — keyframe x/y to pan. */
  get surfacePan(): Record<string, number> { return this.mesh.userData['_jupiterSurfacePan']; }

  /** Live UV-offset uniforms for the cloud texture — keyframe x/y to pan. */
  get cloudPan(): Record<string, number> { return this.mesh.userData['_jupiterCloudPan']; }
}
