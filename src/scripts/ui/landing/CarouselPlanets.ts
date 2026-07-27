// src/scripts/ui/landing/CarouselPlanets.ts
// Renders every carousel/journal/comm-stage planet orb through ONE shared
// WebGLRenderer instead of one WebGLRenderer per canvas. Mobile browsers cap
// real WebGL contexts far lower than this page used to need (up to 10
// simultaneously); a shared-context manager scissor-renders each orb's
// scene into its own on-screen rect on a single shared canvas, and only
// actually renders the orbs currently visible/in budget.
// @triforge/render-budget-core profiles the device once and feeds the
// context budget + a shader-complexity tier back in.

import * as THREE from 'three';
import { ContextPool } from '@triforge/context-pool-core';
import type { Rect } from '@triforge/context-pool-core';
import type { RenderBudgetPlan, ShaderComplexityTier, TextureVariantTier } from '@triforge/render-budget-core';
import { buildCarouselAtmosphereMaterial, buildCarouselSunMaterial } from '../../objects/landing/CarouselPlanetMaterials';
import { resolveTierUrl } from '../../objects/landing/TextureVariants';

// Reimplements @triforge/context-pool-core/three's ThreeContextAdapter, with
// one addition: each client's on-screen rect can be intersected against a
// `clipAncestor` element instead of just the raw anchor's own
// getBoundingClientRect(). The package's own adapter always uses the
// anchor's unclipped rect — fine for orbs with no clipping ancestor, but the
// planet carousel strip (`.lp-planet-carousel`) is a horizontally-scrolled
// `overflow-x: auto` row; items scrolled past its edge are still fully
// within the page viewport (so the package's own visibility check treats
// them as visible) even though the browser would clip their painting. Every
// orb previously had its own small DOM canvas, so that clipping happened
// for free; a single page-covering shared canvas has no such awareness on
// its own, so orbs scrolled off the strip stayed fully rendered and
// overlapped the prev/next arrow buttons.
class ClippableSharedRenderer {
  private pool: ContextPool;
  private renderer: THREE.WebGLRenderer;
  private canvasRect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private contextLost = false;
  private handleContextLost = (event: Event): void => { event.preventDefault(); this.contextLost = true; };
  private handleContextRestored = (): void => { this.contextLost = false; };

  constructor(renderer: THREE.WebGLRenderer, maxConcurrent: number) {
    this.renderer = renderer;
    this.pool = new ContextPool({ maxConcurrent });
    renderer.domElement.addEventListener('webglcontextlost', this.handleContextLost);
    renderer.domElement.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  registerScene(
    id: string, scene: THREE.Scene, camera: THREE.PerspectiveCamera,
    anchor: HTMLCanvasElement, clipAncestor: Element | null, priority: number,
  ): void {
    this.pool.register({
      id,
      priority,
      getAnchorRect: (): Rect | null => {
        const r = anchor.getBoundingClientRect();
        if (r.width <= 0 || r.height <= 0) return null;
        if (!clipAncestor) return { x: r.left, y: r.top, width: r.width, height: r.height };

        const c = clipAncestor.getBoundingClientRect();
        const x1 = Math.max(r.left, c.left), y1 = Math.max(r.top, c.top);
        const x2 = Math.min(r.right, c.right), y2 = Math.min(r.bottom, c.bottom);
        if (x2 <= x1 || y2 <= y1) return null;
        return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
      },
      render: (clippedRect: Rect): void => {
        // clippedRect (from getAnchorRect, already intersected with
        // clipAncestor if any) drives ONLY the scissor test — which pixels
        // are allowed to be written. The viewport — which controls how the
        // camera's projection maps onto the target rectangle — always uses
        // the anchor's own FULL, unclipped size. Using the clipped rect for
        // both (this class's first version) meant a partially-clipped orb's
        // viewport shrank along with it: WebGL doesn't crop an image into a
        // smaller viewport, it re-projects the whole scene to fit, so a
        // sphere clipped down to a few-pixel-wide sliver rendered squished
        // into that sliver and blurred into a solid colour smear — verified
        // by hiding the shared canvas and confirming the smear vanished, and
        // by reproducing the same shape whenever a clip intersection was
        // only a few pixels wide. Real CSS overflow clipping never resizes
        // the content, only crops which pixels show — this restores that.
        const full = anchor.getBoundingClientRect();
        const fullRect: Rect = {
          x: full.left - this.canvasRect.x, y: full.top - this.canvasRect.y,
          width: full.width, height: full.height,
        };

        const glYClip = this.canvasRect.height - clippedRect.y - clippedRect.height;
        const glYFull = this.canvasRect.height - fullRect.y - fullRect.height;

        this.renderer.setScissorTest(true);
        this.renderer.setScissor(clippedRect.x, glYClip, clippedRect.width, clippedRect.height);
        this.renderer.setViewport(fullRect.x, glYFull, fullRect.width, fullRect.height);
        this.renderer.render(scene, camera);
      },
    });
  }

  unregisterScene(id: string): void { this.pool.unregister(id); }
  setMaxConcurrent(n: number): void { this.pool.setMaxConcurrent(n); }

  renderFrame(): void {
    if (this.contextLost) return;
    const r = this.renderer.domElement.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    this.renderer.setScissorTest(false);
    this.renderer.clear();
    this.canvasRect = { x: r.left, y: r.top, width: r.width, height: r.height };
    this.pool.tick(this.canvasRect);
  }

  dispose(): void {
    this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
  }
}

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
  private _adapter!:  ClippableSharedRenderer;
  private _priority = 0;
  private _textureTier: TextureVariantTier = 'high';
  private _resizeHandler = (): void => this._resize();
  // #ex-carousel-canvas is a page-viewport-fixed layer whose per-orb draw
  // rects are computed from each anchor's getBoundingClientRect() on the
  // main-thread rAF tick (see LandingRenderLoop). Native scroll is
  // compositor-driven and can advance a frame ahead of that tick, so the
  // painted orb visibly trails its DOM anchor while scrolling and only
  // catches up once scrolling stops. Re-reading rects on the scroll event
  // itself (fired every compositor frame during scroll) keeps the two in
  // sync instead of waiting for the next rAF.
  private _scrollHandler = (): void => this._adapter?.renderFrame();

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
    clipAncestor: Element | null,
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
        // Scales tuned to this carousel's own tight camera framing (the
        // sphere already fills ~92% of the frame) — the sol-scene Sun.ts
        // sprites this was copied from scale up to 13.5-26, correct there
        // only because that camera views the whole system from far away.
        const scales = [radius * 1.6, radius * 2.0, radius * 1.2];
        for (const s of scales) {
          const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: glowTex, color: sunColor, transparent: true, opacity: 1.0,
            blending: THREE.AdditiveBlending, depthWrite: false,
            // Additive blending's default alpha factors match its RGB
            // factors, so every sprite draw pushes the framebuffer's alpha
            // toward opaque wherever it reaches — invisible on the
            // sol-scene page (opaque background there) but a visible white
            // wash here, where this canvas composites transparently over
            // the page. Never write alpha from these purely-additive glow
            // sprites; only their RGB contribution should matter.
            blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
          }));
          sprite.scale.setScalar(s);
          mesh.add(sprite);
        }

        const highlightLight = new THREE.PointLight(0xfff5eb, 12, 20, 1.5);
        highlightLight.position.set(-radius * 3, radius * 2, radius * 4);
        scene.add(highlightLight);

        this._renderer.toneMappingExposure = 1.4;
        this._entries.push({ id, scene, camera, mesh });
        this._register(id, scene, camera, canvas, clipAncestor);
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
      this._register(id, scene, camera, canvas, clipAncestor);
    });
  }

  private _register(
    id: string, scene: THREE.Scene, camera: THREE.PerspectiveCamera,
    anchor: HTMLCanvasElement, clipAncestor: Element | null,
  ): void {
    // Registration order = default priority (comm-stage/journal orbs register last,
    // after the 8 carousel minis, so if the device-profiled budget is ever tight the
    // small always-visible carousel items keep their slot over the larger showcase orbs).
    this._adapter.registerScene(id, scene, camera, anchor, clipAncestor, this._priority++);
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
    this._adapter = new ClippableSharedRenderer(this._renderer, plan.maxConcurrentContexts);

    const scrollContainer = document.getElementById('lp-scroll-container');
    scrollContainer?.addEventListener('scroll', this._scrollHandler, { passive: true });

    // Only the carousel strip is a scrollable, clipping ancestor
    // (overflow-x: auto) — journal/comm orbs sit in normal page flow, no
    // clip ancestor needed for them.
    const carouselStrip = document.getElementById('lp-planet-carousel');

    const loader = new THREE.TextureLoader();
    this._registerGroup(document.querySelectorAll<HTMLCanvasElement>('canvas.lp-planet-orb'),
      {}, loader, plan.shaderComplexity, carouselStrip);
    // Comm (Saturn) registers before journal (Mercury) so Mercury draws
    // last: the journal orb intentionally bleeds up into the commerce
    // section's space above it (see its `top: -65px` bleed in index.astro),
    // and this single shared canvas has no DOM-style z-index of its own —
    // whichever orb's scissor rect is drawn later simply paints over any
    // pixels it shares with an earlier one. Saturn's comm-stage orb sits
    // close enough to that shared boundary to overlap it at some scroll
    // offsets, and with comm drawn second Saturn was winning that overlap
    // and covering Mercury instead of the other way around.
    this._registerGroup(document.querySelectorAll<HTMLCanvasElement>('canvas.lp-comm-orb'),
      { exposure: 1.3, atmoScale: 1.01, atmoIntensity: 1.0,
        ambientIntensity: 0.10, lightPos: [-4, 2.2, 1.5], lightIntensity: 2.4, ring: true }, loader, plan.shaderComplexity, null);
    this._registerGroup(document.querySelectorAll<HTMLCanvasElement>('canvas.lp-journal-orb'),
      { exposure: 1.2, atmoScale: 1.008, atmoIntensity: 0.9,
        ambientIntensity: 0.08, lightPos: [-4, 2.0, 1], lightIntensity: 2.0, bump: true }, loader, plan.shaderComplexity, null);
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
    document.getElementById('lp-scroll-container')?.removeEventListener('scroll', this._scrollHandler);
    this._adapter?.dispose();
    this._renderer?.dispose();
    this._entries = [];
  }
}
