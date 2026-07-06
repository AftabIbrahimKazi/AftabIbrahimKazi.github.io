// src/scripts/objects/solar-system/neptune/Neptune.ts

import * as THREE from 'three';
import { buildNeptuneSurfaceMaterial } from './NeptuneSurface';
import { buildNeptuneCloudMaterial } from './NeptuneClouds';
import { buildNeptuneAtmosphereMaterial } from './NeptuneAtmosphere';

export class Neptune {

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

    const NEPTUNE_RADIUS = 0.528;
    const geometry = new THREE.SphereGeometry(NEPTUNE_RADIUS, 64, 64);
    geometry.scale(1, 0.983, 1);

    const neptuneTexture = this.loader.load('/textures/solarsystem/planets/neptune/2k_neptune.avif');
    neptuneTexture.colorSpace = THREE.SRGBColorSpace;
    neptuneTexture.anisotropy = 16;
    neptuneTexture.wrapS = neptuneTexture.wrapT = THREE.RepeatWrapping;

    const neptuneSurface = buildNeptuneSurfaceMaterial(neptuneTexture);

    (this as any).mesh = new THREE.Mesh(geometry, neptuneSurface.material);
    this.mesh.renderOrder = 1;
    this.mesh.position.set(245, 0, 0);
    this.pivot.add(this.mesh);
    this.mesh.name = 'ex-neptune-js';

    const cloudGeometry = new THREE.SphereGeometry(NEPTUNE_RADIUS + 0.0015, 64, 64);
    cloudGeometry.scale(1, 0.983, 1);
    const cloudTexture = this.loader.load('/textures/solarsystem/planets/neptune/2k_neptune.avif');
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.anisotropy = 16;
    cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;

    const neptuneClouds = buildNeptuneCloudMaterial(cloudTexture);

    const neptuneCloud = new THREE.Mesh(cloudGeometry, neptuneClouds.material);
    neptuneCloud.renderOrder = 2;
    neptuneCloud.name = 'ex-neptune-cloud-js';
    this.mesh.add(neptuneCloud);

    const atmosphereGeometry = new THREE.SphereGeometry(NEPTUNE_RADIUS + 0.005, 64, 64);
    atmosphereGeometry.scale(1, 0.983, 1);
    const atmosphereMaterial = buildNeptuneAtmosphereMaterial();

    const neptuneAtmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    neptuneAtmosphere.renderOrder = 3;
    neptuneAtmosphere.name = 'ex-neptune-atmosphere-js';
    this.mesh.add(neptuneAtmosphere);

    const glowTexture = this.loader.load('/textures/solarsystem/star/sun/radial-glow-5.avif');
    const neptuneGlowMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: 0x2255cc, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const neptuneGlow = new THREE.Sprite(neptuneGlowMaterial);
    neptuneGlow.scale.set(1.76, 1.76, 1.76);
    neptuneGlow.renderOrder = 4;
    this.mesh.add(neptuneGlow);
    neptuneGlow.name = 'ex-neptune-glow-js';

    this.mesh.rotation.z = THREE.MathUtils.degToRad(28.32);

    this.mesh.userData['_neptuneSurfacePan'] = neptuneSurface.pan;
    this.mesh.userData['_neptuneCloudPan']   = neptuneClouds.pan;
  }

  /** Live UV-offset uniforms for the surface texture â€” keyframe x/y to pan. */
  get surfacePan(): Record<string, number> { return this.mesh.userData['_neptuneSurfacePan']; }

  /** Live UV-offset uniforms for the cloud texture â€” keyframe x/y to pan. */
  get cloudPan(): Record<string, number> { return this.mesh.userData['_neptuneCloudPan']; }
}
