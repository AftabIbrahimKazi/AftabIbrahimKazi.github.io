// src/scripts/objects/solar-system/earth/Earth.ts

import * as THREE from 'three';
import { buildEarthAtmosphereMaterial } from './EarthAtmosphere';
import { buildEarthNightMaterial } from './EarthNight';
import { buildEarthCloudMaterial } from './EarthClouds';
import { buildEarthSurfaceMaterial } from './EarthSurface';

export class Earth {

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

    const geometry             = new THREE.SphereGeometry(0.9, 64, 64);
    const earthDayTexture      = this.loader.load('/textures/solarsystem/planets/earth/8k_earth_daymap.jpg');
    earthDayTexture.colorSpace = THREE.SRGBColorSpace;
    earthDayTexture.anisotropy = 16;
    const earthSpecularTexture = this.loader.load('/textures/solarsystem/planets/earth/8k_earth_specular_map.jpg');

    const earthMaterial = buildEarthSurfaceMaterial(earthDayTexture, earthSpecularTexture);

    (this as any).mesh = new THREE.Mesh(geometry, earthMaterial);
    this.mesh.renderOrder = 1;
    this.mesh.position.set(28, 0, 0);
    this.pivot.add(this.mesh);
    this.mesh.name = 'ex-earth-js';

    const cloudGeometry = new THREE.SphereGeometry(0.9015, 64, 64);
    const cloudTexture  = this.loader.load('/textures/solarsystem/planets/earth/8k_earth_clouds.jpg');
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.anisotropy = 16;

    const earthCloudMaterial = buildEarthCloudMaterial(cloudTexture);

    const earthCloud = new THREE.Mesh(cloudGeometry, earthCloudMaterial);
    earthCloud.renderOrder = 2;
    earthCloud.name = 'ex-earth-cloud-js';
    this.mesh.add(earthCloud);

    const nightGeometry     = new THREE.SphereGeometry(0.901, 64, 64);
    const earthNightTexture = this.loader.load('/textures/solarsystem/planets/earth/8k_earth_nightmap.jpg');
    earthNightTexture.colorSpace = THREE.SRGBColorSpace;
    earthNightTexture.anisotropy = 16;

    const earthNightMaterial = buildEarthNightMaterial(earthNightTexture);

    const earthNightMesh = new THREE.Mesh(nightGeometry, earthNightMaterial);
    earthNightMesh.renderOrder = 2;
    earthNightMesh.name = 'ex-earth-night-js';
    this.mesh.add(earthNightMesh);

    const atmosphereGeometry = new THREE.SphereGeometry(0.9075, 64, 64);
    const atmosphereMaterial = buildEarthAtmosphereMaterial();

    const earthAtmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthAtmosphere.renderOrder = 3;
    earthAtmosphere.name = 'ex-earth-atmosphere-js';
    this.mesh.add(earthAtmosphere);

    const glowTexture = this.loader.load('/textures/solarsystem/star/sun/radial-glow-5.png');
    const earthGlowMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: 0x224488, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const earthGlow = new THREE.Sprite(earthGlowMaterial);
    earthGlow.scale.set(2.8, 2.8, 2.8);
    earthGlow.renderOrder = 4;
    this.mesh.add(earthGlow);
    earthGlow.name = 'ex-earth-glow-js';

    this.mesh.userData['_earthCloud'] = earthCloud;
  }

  get cloud(): THREE.Mesh { return this.mesh.userData['_earthCloud']; }
}
