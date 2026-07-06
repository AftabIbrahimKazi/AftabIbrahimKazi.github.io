// src/scripts/objects/solar-system/saturn/Saturn.ts

import * as THREE from 'three';
import { buildSaturnSurfaceMaterial } from './SaturnSurface';
import { buildSaturnCloudMaterial } from './SaturnClouds';
import { buildSaturnAtmosphereMaterial } from './SaturnAtmosphere';

export class Saturn {

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

    const SATURN_RADIUS = 1.25;
    const geometry = new THREE.SphereGeometry(SATURN_RADIUS, 64, 64);
    geometry.scale(1, 0.902, 1);

    const saturnTexture = this.loader.load('/textures/solarsystem/planets/saturn/8k_saturn.avif');
    saturnTexture.colorSpace = THREE.SRGBColorSpace;
    saturnTexture.anisotropy = 16;
    saturnTexture.wrapS = saturnTexture.wrapT = THREE.RepeatWrapping;

    const saturnSurface = buildSaturnSurfaceMaterial(saturnTexture);

    (this as any).mesh = new THREE.Mesh(geometry, saturnSurface.material);
    this.mesh.renderOrder = 1;
    this.mesh.position.set(119, 0, 0);
    this.pivot.add(this.mesh);
    this.mesh.name = 'ex-saturn-js';

    const cloudGeometry = new THREE.SphereGeometry(SATURN_RADIUS + 0.0015, 64, 64);
    cloudGeometry.scale(1, 0.902, 1);
    const cloudTexture = this.loader.load('/textures/solarsystem/planets/saturn/8k_saturn.avif');
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.anisotropy = 16;
    cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;

    const saturnClouds = buildSaturnCloudMaterial(cloudTexture);

    const saturnCloud = new THREE.Mesh(cloudGeometry, saturnClouds.material);
    saturnCloud.renderOrder = 2;
    saturnCloud.name = 'ex-saturn-cloud-js';
    this.mesh.add(saturnCloud);

    const atmosphereGeometry = new THREE.SphereGeometry(SATURN_RADIUS + 0.005, 64, 64);
    atmosphereGeometry.scale(1, 0.902, 1);
    const atmosphereMaterial = buildSaturnAtmosphereMaterial();

    const saturnAtmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    saturnAtmosphere.renderOrder = 3;
    saturnAtmosphere.name = 'ex-saturn-atmosphere-js';
    this.mesh.add(saturnAtmosphere);

    const glowTexture = this.loader.load('/textures/solarsystem/star/sun/radial-glow-5.avif');
    const saturnGlowMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: 0x9a8050, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const saturnGlow = new THREE.Sprite(saturnGlowMaterial);
    saturnGlow.scale.set(4.2, 4.2, 4.2);
    saturnGlow.renderOrder = 4;
    this.mesh.add(saturnGlow);
    saturnGlow.name = 'ex-saturn-glow-js';

    const ringTexture = this.loader.load('/textures/solarsystem/planets/saturn/8k_saturn_ring_alpha.png');
    ringTexture.colorSpace = THREE.SRGBColorSpace;
    ringTexture.anisotropy = 16;
    const ringGeom = new THREE.RingGeometry(1.39, 2.84, 128);
    const rPos = ringGeom.attributes.position, rUv = ringGeom.attributes.uv, rV3 = new THREE.Vector3();
    for (let i = 0; i < rPos.count; i++) {
      rV3.fromBufferAttribute(rPos, i);
      rUv.setXY(i, (rV3.length() - 1.39) / (2.84 - 1.39), 1);
    }
    const saturnRingMaterial = new THREE.MeshBasicMaterial({ map: ringTexture, side: THREE.DoubleSide, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }) as any;
    const saturnRing = new THREE.Mesh(ringGeom, saturnRingMaterial);
    saturnRing.rotation.x = Math.PI / 2;
    saturnRing.renderOrder = 2;
    saturnRing.name = 'ex-saturn-ring-js';
    this.mesh.add(saturnRing);

    this.mesh.rotation.z = THREE.MathUtils.degToRad(26.73);

    this.mesh.userData['_saturnSurfacePan'] = saturnSurface.pan;
    this.mesh.userData['_saturnCloudPan']   = saturnClouds.pan;
  }

  /** Live UV-offset uniforms for the surface texture â€” keyframe x/y to pan. */
  get surfacePan(): Record<string, number> { return this.mesh.userData['_saturnSurfacePan']; }

  /** Live UV-offset uniforms for the cloud texture â€” keyframe x/y to pan. */
  get cloudPan(): Record<string, number> { return this.mesh.userData['_saturnCloudPan']; }
}
