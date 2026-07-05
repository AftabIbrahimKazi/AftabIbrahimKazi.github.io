// src/scripts/objects/solar-system/venus/Venus.ts

import * as THREE from 'three';
import { buildVenusSurfaceMaterial } from './VenusSurface';
import { buildVenusCloudMaterial } from './VenusClouds';
import { buildVenusAtmosphereMaterial } from './VenusAtmosphere';

export class Venus {

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

    const geometry     = new THREE.SphereGeometry(0.8, 64, 64);
    const venusTexture = this.loader.load('/textures/solarsystem/planets/venus/venus-texture.jpg');
    venusTexture.colorSpace = THREE.SRGBColorSpace;
    venusTexture.anisotropy = 16;

    const venusMaterial = buildVenusSurfaceMaterial(venusTexture);

    (this as any).mesh = new THREE.Mesh(geometry, venusMaterial);
    this.mesh.renderOrder = 1;
    this.mesh.position.set(18, 0, 0);
    this.pivot.add(this.mesh);
    this.mesh.name = 'ex-venus-js';

    const cloudGeometry = new THREE.SphereGeometry(0.8015, 64, 64);
    const cloudTexture  = this.loader.load('/textures/solarsystem/planets/venus/venus-cloud-texture.jpg');
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.anisotropy = 16;

    const venusCloudMaterial = buildVenusCloudMaterial(cloudTexture);

    const venusCloud = new THREE.Mesh(cloudGeometry, venusCloudMaterial);
    venusCloud.renderOrder = 2;
    venusCloud.name = 'ex-venus-cloud-js';
    this.mesh.add(venusCloud);

    const atmosphereGeometry = new THREE.SphereGeometry(0.80125, 64, 64);
    const atmosphereMaterial = buildVenusAtmosphereMaterial();

    const venusAtmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    venusAtmosphere.renderOrder = 3;
    venusAtmosphere.name = 'ex-venus-atmosphere-js';
    this.mesh.add(venusAtmosphere);

    const glowTexture = this.loader.load('/textures/solarsystem/star/sun/radial-glow-5.png');
    const venusGlowMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: 0xfff5eb, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
    const venusGlow = new THREE.Sprite(venusGlowMaterial);
    venusGlow.scale.set(2.8, 2.8, 2.8);
    venusGlow.renderOrder = 4;
    this.mesh.add(venusGlow);
    venusGlow.name = 'ex-venus-glow-js';

    this.mesh.userData['_venusCloud'] = venusCloud;
  }

  get cloud(): THREE.Mesh { return this.mesh.userData['_venusCloud']; }
}
