// src/scripts/objects/solar-system/mars/Mars.ts

import * as THREE from 'three';
import { buildMarsSurfaceMaterial } from './MarsSurface';
import { buildMarsDustMaterial } from './MarsDust';
import { buildMarsAtmosphereMaterial } from './MarsAtmosphere';

export class Mars {

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

    const geometry    = new THREE.SphereGeometry(0.7, 64, 64);
    const marsTexture = this.loader.load('/textures/solarsystem/planets/mars/8k_mars.jpg');
    marsTexture.colorSpace = THREE.SRGBColorSpace;
    marsTexture.anisotropy = 16;

    const marsMaterial = buildMarsSurfaceMaterial(marsTexture);

    (this as any).mesh = new THREE.Mesh(geometry, marsMaterial);
    this.mesh.renderOrder = 1;
    this.mesh.position.set(38, 0, 0);
    this.pivot.add(this.mesh);
    this.mesh.name = 'ex-mars-js';

    const cloudGeometry = new THREE.SphereGeometry(0.7015, 64, 64);
    const dustTexture   = this.loader.load('/textures/solarsystem/planets/mars/mars-cloud-texture.jpg');
    dustTexture.colorSpace = THREE.SRGBColorSpace;
    dustTexture.anisotropy = 16;

    const marsCloudMaterial = buildMarsDustMaterial(dustTexture);

    const marsCloud = new THREE.Mesh(cloudGeometry, marsCloudMaterial);
    marsCloud.renderOrder = 2;
    marsCloud.name = 'ex-mars-dust-js';
    this.mesh.add(marsCloud);

    const atmosphereGeometry = new THREE.SphereGeometry(0.7025, 64, 64);
    const atmosphereMaterial = buildMarsAtmosphereMaterial();

    const marsAtmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    marsAtmosphere.renderOrder = 3;
    marsAtmosphere.name = 'ex-mars-atmosphere-js';
    this.mesh.add(marsAtmosphere);

    const glowTexture = this.loader.load('/textures/solarsystem/star/sun/radial-glow-5.png');
    const marsGlowMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: 0x8b5a3a, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false });
    const marsGlow = new THREE.Sprite(marsGlowMaterial);
    marsGlow.scale.set(2.8, 2.8, 2.8);
    marsGlow.renderOrder = 4;
    this.mesh.add(marsGlow);
    marsGlow.name = 'ex-mars-glow-js';

    this.mesh.userData['_marsCloud'] = marsCloud;
  }

  get cloud(): THREE.Mesh { return this.mesh.userData['_marsCloud']; }
}
