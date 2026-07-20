// src/scripts/ui/landing/CarouselPlanets.ts
// Renders every carousel/journal/comm-stage planet orb through ONE shared
// WebGLRenderer (@triforge/context-pool-core's ThreeContextAdapter) instead of
// one WebGLRenderer per canvas. Mobile browsers cap real WebGL contexts far
// lower than this page used to need (up to 10 simultaneously); the adapter
// scissor-renders each orb's scene into its own on-screen rect on a single
// shared canvas, and only actually renders the orbs currently visible/in
// budget. @triforge/render-budget-core profiles the device once and feeds
// the context budget + a shader-complexity tier back in.

import * as THREE from 'three';
import { ThreeContextAdapter } from '@triforge/context-pool-core/three';
import type { RenderBudgetPlan, ShaderComplexityTier, TextureVariantTier } from '@triforge/render-budget-core';
import { buildCarouselAtmosphereMaterial, buildCarouselSunMaterial } from '../../objects/landing/CarouselPlanetMaterials';
import { resolveTierUrl } from '../../objects/landing/TextureVariants';

// Per-planet atmosphere glow colour (matches the glow colour in each planet's atmosphere builder).
const ATMO_COLOR: Record<string, THREE.Color> = {
  mercury: new THREE.Color(0.8,  0.9,  1.0),
  venus:   new THREE.Color(1.0,  0.85, 0.5),
  earth:   new THREE.Color(0.3,  0.6,  1.0),
  mars:    new THREE.Color(1.0,  0.4,  0.15),
  jupiter: new THREE.Color(0.9,  0.75, 0.55),
  saturn:  new THREE.Color(0.85, 0.75, 0.55),
  uranus:  new THREE.Color(0.4,  0.85, 1.0),
  neptune: new THREE.Color(0.25, 0.45, 1.0),
};

// Axial tilts (degrees) matching the planet class rotation.z values.
const TILT: Record<string, number> = {
  sun:     0,
  mercury: 0.03,
  venus:   177.36,
  earth:   23.44,
  mars:    25.19,
  jupiter: 3.13,
  saturn:  26.73,
  uranus:  97.77,
  neptune: 28.32,
};

// Planet sphere radii matching each planet class's SphereGeometry radius.
const RADIUS: Record<string, number> = {
  sun:     0.75,
  mercury: 0.5,
  venus:   0.8,
  earth:   0.9,
  mars:    0.7,
  jupiter: 1.5,
  saturn:  1.25,
  uranus:  0.545,
  neptune: 0.528,
};

const SUN_GLOW_URL = '/textures/solarsystem/star/sun/radial-glow-5.avif';

interface CanvasOptions {
  exposure?:        number;
  atmoScale?:       number;
  atmoIntensity?:   number;
  ambientIntensity?: number;
  lightPos?:        [number, number, number];
  lightIntensity?:  number;
  ring?:            boolean;
  /** Enable crater/terrain relief on planets that define a bump scale below. */
  bump?:            boolean;
}

// Bump scale per planet — three.js's stock MeshStandardMaterial.bumpMap uses
// screen-space dFdx/dFdy on raw texture values, unrelated in magnitude to the
// node-graph Bump.strength values on the real solar-system surfaces, so these
// are tuned independently by visual inspection. Reuses the colour texture as
// the height source — same approach the real Mercury surface used before its
// node-graph port to a dedicated Bump/TextureBump node.
const BUMP_SCALE: Record<string, number> = {
  mercury: 0.22,
};

// Saturn ring inner/outer radii, matching objects/Saturn.ts.
const SATURN_RING_INNER = 1.39;
const SATURN_RING_OUTER = 2.84;

interface PlanetEntry {
  id:     string;
  scene:  THREE.Scene;
  camera: THREE.PerspectiveCamera;
  mesh:   THREE.Mesh;
}

export class CarouselPlanets {

  private _entries: PlanetEntry[] = [];
  private _renderer!: THREE.WebGLRenderer;
  private _adapter!:  ThreeContextAdapter;
  private _priority = 0;
  private _textureTier: TextureVariantTier = 'high';
  private _resizeHandler = (): void => this._resize();

  private _resize(): void {
    const dpr = Math.min(devicePixelRatio, 2);
    this._renderer.setPixelRatio(dpr);
    this._renderer.setSize(innerWidth, innerHeight, false);
  }

  // shaderComplexity gates the two genuinely-expensive per-orb extras — the
  // fresnel atmosphere (its own ShaderMaterial node graph) and the cloud
  // shell (a second full-resolution textured sphere) — not the base planet
  // sphere itself, which every tier still renders.
  private _registerGroup(
    canvases: NodeListOf<HTMLCanvasElement>,
    opts: CanvasOptions,
    loader: THREE.TextureLoader,
    complexity: ShaderComplexityTier,
  ): void {
    const { exposure = 2.2, atmoScale = 1.012, atmoIntensity = 1.5,
            ambientIntensity = 0.15, lightPos = [-5, 1.8, 2] as [number, number, number],
            lightIntensity = 3.5 } = opts;

    const wantsAtmosphere = complexity !== 'baked-only';
    const wantsClouds     = complexity === 'full';

    canvases.forEach(canvas => {
      const textureUrl = canvas.dataset.texture;
      const planet     = canvas.dataset.planet;
      if (!textureUrl || !planet) return;

      const radius  = RADIUS[planet] ?? 0.6;
      const tilt    = THREE.MathUtils.degToRad(TILT[planet] ?? 0);
      const hasRing = planet === 'saturn' && !!opts.ring;

      // Camera distance: fits the planet (or its ring span, if present) at ~92% of the frame height at FOV 50°.
      const frameRadius = hasRing ? radius * (SATURN_RING_OUTER / 1.25) * 1.05 : radius;
      const dist   = frameRadius / (0.85 * Math.tan(THREE.MathUtils.degToRad(25)));
      const camZ   = dist * 0.92;
      const camY   = dist * 0.20;

      const scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, ambientIntensity));
      const sunLight = new THREE.DirectionalLight(0xffffff, lightIntensity);
      sunLight.position.set(...lightPos);
      scene.add(sunLight);

      const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
      camera.position.set(0, camY, camZ);
      camera.lookAt(0, 0, 0);

      const texture = loader.load(resolveTierUrl(textureUrl, this._textureTier));
      texture.colorSpace = THREE.SRGBColorSpace;

      const geo  = new THREE.SphereGeometry(radius, 64, 64);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial());
      mesh.rotation.z = tilt;
      scene.add(mesh);

      const id = `${planet}:${this._entries.length}`;

      if (planet === 'sun') {
        const sunColor = new THREE.Color(0xfff3c4);
        mesh.material  = buildCarouselSunMaterial(texture);

        const glowTex  = loader.load(resolveTierUrl(SUN_GLOW_URL, this._textureTier));
        const glowOpts = { map: glowTex, color: sunColor, transparent: true, opacity: 1.0, blending: THREE.AdditiveBlending, depthWrite: false };
        const scales   = [radius * 5.5, radius * 7.0, radius * 4.0];
        for (const s of scales) {
          const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ ...glowOpts }));
          sprite.scale.setScalar(s);
          mesh.add(sprite);
        }

        const highlightLight = new THREE.PointLight(0xfff5eb, 12, 20, 1.5);
        highlightLight.position.set(-radius * 3, radius * 2, radius * 4);
        scene.add(highlightLight);

        this._renderer.toneMappingExposure = 1.4;
        this._entries.push({ id, scene, camera, mesh });
        this._register(id, scene, camera, canvas);
        return;
      }

      (mesh.material as THREE.MeshStandardMaterial).map      = texture;
      (mesh.material as THREE.MeshStandardMaterial).roughness = 0.75;
      (mesh.material as THREE.MeshStandardMaterial).metalness = 0.0;

      const bumpScale = BUMP_SCALE[planet];
      if (opts.bump && bumpScale) {
        (mesh.material as THREE.MeshStandardMaterial).bumpMap   = texture;
        (mesh.material as THREE.MeshStandardMaterial).bumpScale = bumpScale;
      }

      (mesh.material as THREE.MeshStandardMaterial).needsUpdate = true;

      // Cloud / haze layers — matching each planet class's cloud setup.
      const cloudDef: { url: string; mat: THREE.MeshStandardMaterialParameters } | null =
        !wantsClouds ? null :
        planet === 'earth'
          ? { url: '/textures/solarsystem/planets/earth/8k_earth_clouds.avif',
              mat: { alphaMap: null, transparent: true, opacity: 1.0, alphaTest: 0.05, roughness: 0.75, metalness: 0.0, depthWrite: false } }
        : planet === 'venus'
          ? { url: '/textures/solarsystem/planets/venus/venus-cloud-texture.avif',
              mat: { color: new THREE.Color(0xffe8a0), transparent: true, opacity: 0.75, roughness: 1.0, metalness: 0.0, depthWrite: false } }
        : planet === 'mars'
          ? { url: '/textures/solarsystem/planets/mars/mars-cloud-texture.avif',
              mat: { emissive: new THREE.Color(0xffd4a0), emissiveIntensity: 0.75, color: new THREE.Color(0xffd4a0),
                     transparent: true, opacity: 0.25, alphaMap: null, alphaTest: 0.05, roughness: 1.0, metalness: 0.0, depthWrite: false } }
        : null;

      if (cloudDef) {
        const cloudTex = loader.load(resolveTierUrl(cloudDef.url, this._textureTier));
        cloudTex.colorSpace = THREE.SRGBColorSpace;
        const params = { ...cloudDef.mat, map: cloudTex };
        if ('alphaMap' in params && params.alphaMap === null) params.alphaMap = cloudTex;
        if ('emissiveMap' in cloudDef.mat) (params as any).emissiveMap = cloudTex;
        const cloudMat  = new THREE.MeshStandardMaterial(params);
        const cloudMesh = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.002, 64, 64), cloudMat);
        cloudMesh.rotation.z = tilt;
        scene.add(cloudMesh);
        mesh.userData['cloudMesh'] = cloudMesh;
      }

      // Fresnel atmosphere rim — triforge node graph, matches the per-planet atmosphere builders.
      if (wantsAtmosphere) {
        const atmoColor = ATMO_COLOR[planet] ?? new THREE.Color(0.5, 0.7, 1.0);
        const atmoGeo   = new THREE.SphereGeometry(radius * atmoScale, 64, 64);
        const atmoMat   = buildCarouselAtmosphereMaterial(atmoColor, atmoIntensity);
        const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
        atmoMesh.rotation.z = tilt;
        scene.add(atmoMesh);
      }

      if (hasRing) {
        const ringTex = loader.load('/textures/solarsystem/planets/saturn/8k_saturn_ring_alpha.png');
        ringTex.colorSpace = THREE.SRGBColorSpace;
        const ringScale = radius / 1.25;
        const innerR = SATURN_RING_INNER * ringScale;
        const outerR = SATURN_RING_OUTER * ringScale;
        const ringGeo = new THREE.RingGeometry(innerR, outerR, 128);
        const rPos = ringGeo.attributes.position, rUv = ringGeo.attributes.uv, rV3 = new THREE.Vector3();
        for (let i = 0; i < rPos.count; i++) {
          rV3.fromBufferAttribute(rPos, i);
          rUv.setXY(i, (rV3.length() - innerR) / (outerR - innerR), 1);
        }
        const ringMat = new THREE.MeshBasicMaterial({
          map: ringTex, side: THREE.DoubleSide, transparent: true,
          opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        mesh.add(ring);
      }

      this._entries.push({ id, scene, camera, mesh });
      this._register(id, scene, camera, canvas);
    });
  }

  private _register(id: string, scene: THREE.Scene, camera: THREE.PerspectiveCamera, anchor: HTMLCanvasElement): void {
    // Registration order = default priority (comm-stage/journal orbs register last,
    // after the 8 carousel minis, so if the device-profiled budget is ever tight the
    // small always-visible carousel items keep their slot over the larger showcase orbs).
    this._adapter.registerScene(id, { scene, camera, anchor, priority: this._priority++ });
  }

  // Takes the plan as an already-in-flight Promise (LandingOrchestrator
  // starts resolving it before/alongside constructing this class) and awaits
  // it BEFORE creating this._renderer or loading any texture. Building
  // eagerly at a default and rebuilding afterward would mean a visitor who
  // gets downgraded has already paid for the full-resolution download too —
  // strictly worse than loading the small file from the start on exactly the
  // connections this exists to help. Awaiting first also keeps this
  // renderer's construction from colliding with the hardware probe's
  // deliberate context-count stress test (see RenderBudget.ts) — creating it
  // any earlier reintroduces the same context-eviction bug that motivated
  // moving the probe out of this class in the first place.
  async init(planPromise: Promise<RenderBudgetPlan>): Promise<void> {
    const canvasEl = document.getElementById('ex-carousel-canvas') as HTMLCanvasElement | null;
    if (!canvasEl) return;

    const plan = await planPromise;

    this._renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
    this._renderer.setClearColor(0x000000, 0);
    this._renderer.outputColorSpace    = THREE.SRGBColorSpace;
    this._renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 2.2;
    this._resize();
    addEventListener('resize', this._resizeHandler);

    this._textureTier = plan.textureTier;
    this._adapter = new ThreeContextAdapter({
      renderer: this._renderer,
      maxConcurrent: plan.maxConcurrentContexts,
    });

    const loader = new THREE.TextureLoader();
    this._registerGroup(document.querySelectorAll<HTMLCanvasElement>('canvas.lp-planet-orb'),
      {}, loader, plan.shaderComplexity);
    this._registerGroup(document.querySelectorAll<HTMLCanvasElement>('canvas.lp-journal-orb'),
      { exposure: 1.2, atmoScale: 1.008, atmoIntensity: 0.9,
        ambientIntensity: 0.08, lightPos: [-4, 2.0, 1], lightIntensity: 2.0, bump: true }, loader, plan.shaderComplexity);
    this._registerGroup(document.querySelectorAll<HTMLCanvasElement>('canvas.lp-comm-orb'),
      { exposure: 1.3, atmoScale: 1.01, atmoIntensity: 1.0,
        ambientIntensity: 0.10, lightPos: [-4, 2.2, 1.5], lightIntensity: 2.4, ring: true }, loader, plan.shaderComplexity);
  }

  // Driven by LandingRenderLoop — no private requestAnimationFrame chain here.
  update(elapsed: number): void {
    // init() awaits the device/network plan before the adapter exists — the
    // render loop's first frame(s) can land before that resolves, especially
    // on a slow probe. No-op until then rather than throw.
    if (!this._adapter) return;
    for (const { mesh } of this._entries) {
      mesh.rotation.y = elapsed * 0.2;
      const cloud = mesh.userData['cloudMesh'] as THREE.Mesh | undefined;
      if (cloud) cloud.rotation.y = elapsed * 0.22;
    }
    this._adapter.renderFrame();
  }

  destroy(): void {
    removeEventListener('resize', this._resizeHandler);
    this._adapter?.dispose();
    this._renderer?.dispose();
    this._entries = [];
  }
}
