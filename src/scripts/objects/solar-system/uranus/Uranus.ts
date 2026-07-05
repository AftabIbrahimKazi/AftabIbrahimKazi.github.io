// src/scripts/objects/solar-system/uranus/Uranus.ts

import * as THREE from 'three';
import { buildUranusSurfaceMaterial } from './UranusSurface';
import { buildUranusCloudMaterial } from './UranusClouds';
import { buildUranusAtmosphereMaterial } from './UranusAtmosphere';

export class Uranus {

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

    const URANUS_RADIUS = 0.545;
    const geometry = new THREE.SphereGeometry(URANUS_RADIUS, 64, 64);
    geometry.scale(1, 0.977, 1);

    const uranusTexture = this.loader.load('/textures/solarsystem/planets/uranus/2k_uranus.jpg');
    uranusTexture.colorSpace = THREE.SRGBColorSpace;
    uranusTexture.anisotropy = 16;
    uranusTexture.wrapS = uranusTexture.wrapT = THREE.RepeatWrapping;

    const uranusSurface = buildUranusSurfaceMaterial(uranusTexture);

    (this as any).mesh = new THREE.Mesh(geometry, uranusSurface.material);
    this.mesh.renderOrder = 1;
    this.mesh.position.set(185, 0, 0);
    this.pivot.add(this.mesh);
    this.mesh.name = 'ex-uranus-js';

    const cloudGeometry = new THREE.SphereGeometry(URANUS_RADIUS + 0.0015, 64, 64);
    cloudGeometry.scale(1, 0.977, 1);
    const cloudTexture = this.loader.load('/textures/solarsystem/planets/uranus/2k_uranus.jpg');
    cloudTexture.colorSpace = THREE.SRGBColorSpace;
    cloudTexture.anisotropy = 16;
    cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;

    const uranusClouds = buildUranusCloudMaterial(cloudTexture);

    const uranusCloud = new THREE.Mesh(cloudGeometry, uranusClouds.material);
    uranusCloud.renderOrder = 2;
    uranusCloud.name = 'ex-uranus-cloud-js';
    this.mesh.add(uranusCloud);

    const atmosphereGeometry = new THREE.SphereGeometry(URANUS_RADIUS + 0.005, 64, 64);
    atmosphereGeometry.scale(1, 0.977, 1);
    const atmosphereMaterial = buildUranusAtmosphereMaterial();

    const uranusAtmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    uranusAtmosphere.renderOrder = 3;
    uranusAtmosphere.name = 'ex-uranus-atmosphere-js';
    this.mesh.add(uranusAtmosphere);

    const glowTexture = this.loader.load('/textures/solarsystem/star/sun/radial-glow-5.png');
    const uranusGlowMaterial = new THREE.SpriteMaterial({ map: glowTexture, color: 0x5ecfcf, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false });
    const uranusGlow = new THREE.Sprite(uranusGlowMaterial);
    uranusGlow.scale.set(1.8, 1.8, 1.8);
    uranusGlow.renderOrder = 4;
    this.mesh.add(uranusGlow);
    uranusGlow.name = 'ex-uranus-glow-js';

    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 512; ringCanvas.height = 1;
    const ctx = ringCanvas.getContext('2d')!;
    const ringBands = [
      { pos: 0.08, width: 0.008, alpha: 0.4 }, { pos: 0.14, width: 0.008, alpha: 0.4 },
      { pos: 0.20, width: 0.010, alpha: 0.45 }, { pos: 0.27, width: 0.012, alpha: 0.5 },
      { pos: 0.36, width: 0.012, alpha: 0.5 }, { pos: 0.46, width: 0.010, alpha: 0.45 },
      { pos: 0.54, width: 0.012, alpha: 0.5 }, { pos: 0.62, width: 0.010, alpha: 0.45 },
      { pos: 0.72, width: 0.010, alpha: 0.4 }, { pos: 0.88, width: 0.035, alpha: 0.9 },
    ];
    ringBands.forEach(({ pos, width, alpha }) => {
      const x = pos * ringCanvas.width, w = width * ringCanvas.width;
      const grad = ctx.createLinearGradient(x - w, 0, x + w, 0);
      grad.addColorStop(0, `rgba(160,200,210,0)`);
      grad.addColorStop(0.5, `rgba(160,200,210,${alpha})`);
      grad.addColorStop(1, `rgba(160,200,210,0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(x - w, 0, w * 2, 1);
    });
    const ringTexture = new THREE.CanvasTexture(ringCanvas);
    const ringInner = URANUS_RADIUS * 1.60, ringOuter = URANUS_RADIUS * 2.00;
    const ringGeom  = new THREE.RingGeometry(ringInner, ringOuter, 128);
    const rPos = ringGeom.attributes.position, rUv = ringGeom.attributes.uv, rV3 = new THREE.Vector3();
    for (let i = 0; i < rPos.count; i++) {
      rV3.fromBufferAttribute(rPos, i);
      rUv.setXY(i, (rV3.length() - ringInner) / (ringOuter - ringInner), 1);
    }
    const uranusRingMaterial = new THREE.MeshBasicMaterial({ map: ringTexture, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const uranusRing = new THREE.Mesh(ringGeom, uranusRingMaterial);
    uranusRing.rotation.x = Math.PI / 2;
    uranusRing.renderOrder = 2;
    uranusRing.name = 'ex-uranus-ring-js';
    this.mesh.add(uranusRing);

    this.mesh.rotation.z = THREE.MathUtils.degToRad(97.77);

    this.mesh.userData['_uranusSurfacePan'] = uranusSurface.pan;
    this.mesh.userData['_uranusCloudPan']   = uranusClouds.pan;
  }

  /** Live UV-offset uniforms for the surface texture — keyframe x/y to pan. */
  get surfacePan(): Record<string, number> { return this.mesh.userData['_uranusSurfacePan']; }

  /** Live UV-offset uniforms for the cloud texture — keyframe x/y to pan. */
  get cloudPan(): Record<string, number> { return this.mesh.userData['_uranusCloudPan']; }
}
