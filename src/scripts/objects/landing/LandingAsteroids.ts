// src/scripts/objects/landing/LandingAsteroids.ts
// Procedurally generated background asteroids.
// Approach matches example-asteroid.html exactly: IcosahedronGeometry(1, detail)
// with direct radial vertex displacement — no modifier stack, no normal-push.
// Radial displacement (scale unit normal by noise) is stable at any amplitude;
// the modifier/normal-push approach folds triangles on low-res meshes.

import * as THREE from 'three';

// ── Settings (asteroid-settings.json) ───────────────────────────────────────

const ELONG_X      = 1.35;   // X stretch
const ELONG_Y      = 0.75;   // Y flatten — disc-like
const ELONG_Z      = 1.00;   // Z
const BUMP_LG      = 0.45;   // large-scale lump amplitude
const BUMP_MD      = 0.25;   // medium amplitude
const BUMP_SM      = 0.05;   // fine surface amplitude
const ROUGH_AMT    = 0.35;   // FBM roughness — lower = smoother high-freq falloff, fewer sharp peaks
const CRATER_N     = 11;    // craters per asteroid — few large + many small (crater saturation)
const CRATER_R_MIN = 0.03;   // min crater angular radius (radians)
const CRATER_R_MAX = 0.25;   // max crater angular radius
const CRATER_DP    = 0.35;   // crater depth
const CRATER_RIM   = 0.35;   // rim height relative to depth
const CRATER_RIM_W = 0.15;   // rim width (fraction of crater radius)
const EJECTA       = 0.25;   // ejecta blanket reach
const CRATER_FLAT  = 0.50;   // floor flatness (0 = bowl, 1 = flat disc)
const COL_DARK     = new THREE.Color('#0b0a08');  // near-black — crater pits and deep shadow areas
const COL_MID      = new THREE.Color('#3a3328');  // mid grey-brown — bulk of the surface
const COL_LIGHT    = new THREE.Color('#9a8e7a');  // warm light grey — sunlit peaks and ridges
const MAT_ROUGH    = 0.95;                        // fully diffuse scatter — no gloss at all
const MAT_METAL    = 0.0;                         // zero metalness
const SPIN_SPD     = 0.10;
const TUMBLE_SPD   = 0.05;

// ── Scene layout ─────────────────────────────────────────────────────────────

const GEO_DETAIL  = 15;       // IcosahedronGeometry detail — 20480 faces (matches example subdiv:6)
const VARIANTS    = 4;      // distinct rock shapes — one draw call each
const PER_VARIANT = 6;
const INNER_R     = 75;
const OUTER_R     = 175;
const MIN_SCALE   = 0.75;
const MAX_SCALE   = 7.75;

// ── Seeded RNG (mulberry32) ──────────────────────────────────────────────────

function makeRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Value noise + FBM (mirrors the example's implementation) ─────────────────

function fade(t: number): number { return t * t * t * (t * (t * 6 - 15) + 10); }
function lrp(a: number, b: number, t: number): number { return a + (b - a) * t; }

function lcg(s: number): number { return ((s * 1664525 + 1013904223) & 0xffffffff) >>> 0; }

function hash3(ix: number, iy: number, iz: number, seed: number): number {
  let h = ((seed * 1234567891 + ix * 73856093 + iy * 19349663 + iz * 83492791) >>> 0);
  h = lcg(h); h = lcg(h);
  return h / 0xffffffff;
}

function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const u = fade(x - xi), v = fade(y - yi), w = fade(z - zi);
  return lrp(
    lrp(lrp(hash3(xi,yi,zi,seed),     hash3(xi+1,yi,zi,seed),   u),
        lrp(hash3(xi,yi+1,zi,seed),   hash3(xi+1,yi+1,zi,seed), u), v),
    lrp(lrp(hash3(xi,yi,zi+1,seed),   hash3(xi+1,yi,zi+1,seed),   u),
        lrp(hash3(xi,yi+1,zi+1,seed), hash3(xi+1,yi+1,zi+1,seed), u), v),
    w,
  );
}

function fbm(x: number, y: number, z: number, seed: number, octaves: number, roughness: number): number {
  let val = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < octaves; i++) {
    val += valueNoise3(x * freq, y * freq, z * freq, seed + i * 137) * amp;
    max += amp; amp *= roughness; freq *= 2;
  }
  return val / max; // [0, 1]
}

// ── Procedural rock normal map ────────────────────────────────────────────────
// Generates a tileable normal map on a canvas using multi-octave value noise.
// Built once and shared across all asteroid variants — no external assets needed.
// Pipeline: noise heightmap → central-difference normals → RGB CanvasTexture.

function buildRockNormalMap(size = 512): THREE.CanvasTexture {
  const heights = new Float32Array(size * size);
  const scale   = 6.0;   // tile frequency — higher = finer grain
  const seed    = 9001;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x / size) * scale;
      const v = (y / size) * scale;
      // Three octaves: macro cracks + medium grain + fine pits
      const h = fbm(u, v, 0, seed,        3, 0.55) * 0.55
              + fbm(u, v, 0, seed + 777,  2, 0.60) * 0.30
              + fbm(u, v, 0, seed + 1999, 2, 0.65) * 0.15;
      heights[y * size + x] = h;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx  = canvas.getContext('2d')!;
  const data = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Wrap-safe neighbour sampling
      const l = heights[y * size + ((x - 1 + size) % size)];
      const r = heights[y * size + ((x + 1)         % size)];
      const t = heights[((y - 1 + size) % size) * size + x];
      const b = heights[((y + 1)         % size) * size + x];

      // Central differences → unnormalised tangent-space normal
      let nx = (l - r) * 4.0;   // strength multiplier — raise for deeper relief
      let ny = (t - b) * 4.0;
      let nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len; ny /= len; nz /= len;

      const i = (y * size + x) * 4;
      data.data[i]     = Math.round((nx * 0.5 + 0.5) * 255); // R = X
      data.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255); // G = Y
      data.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255); // B = Z
      data.data[i + 3] = 255;
    }
  }

  ctx.putImageData(data, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);   // tile 4× across the icosphere UVs for finer grain
  return tex;
}

// ── Crater profile ────────────────────────────────────────────────────────────
// d = normalised distance from crater centre (0=centre, 1=rim edge, >1=outside)
// Returns signed radial displacement (negative = dug in, positive = raised rim)

function craterProfile(d: number, depth: number, rimH: number, rimW: number,
                        flatness: number, ejecta: number): number {
  if (d >= 1 + rimW + ejecta * 0.5) return 0;

  if (d <= 1) {
    const bowl  = d * d;
    const floor = lrp(bowl, 0, flatness);
    return -depth * floor;
  }

  const rimZone = d - 1;
  if (rimZone <= rimW) {
    const t = rimZone / rimW;
    return rimH * depth * Math.sin(t * Math.PI);
  }

  if (ejecta > 0.001) {
    const eZone  = rimZone - rimW;
    const eReach = ejecta * 0.5;
    if (eZone <= eReach) {
      const t = eZone / eReach;
      return rimH * depth * 0.3 * (1 - t) * (1 - t);
    }
  }

  return 0;
}

// ── Geometry build ────────────────────────────────────────────────────────────

interface CraterDef { nx: number; ny: number; nz: number; r: number; depthScale: number }

function rng(seed: number, i: number): number {
  const s1 = lcg((seed * 2654435761 >>> 0) ^ (i * 2246822519 >>> 0));
  const s2 = lcg(s1);
  return lcg(s2) / 0xffffffff;
}

function buildAsteroidGeo(variantIndex: number): THREE.BufferGeometry {
  const seed = variantIndex * 13337 + 7;

  const geo = new THREE.IcosahedronGeometry(1, GEO_DETAIL);
  const src = geo.getAttribute('position') as THREE.BufferAttribute;
  const count = src.count;

  // Pre-generate craters (matching the example exactly)
  const craters: CraterDef[] = [];
  for (let c = 0; c < CRATER_N; c++) {
    let cx: number, cy: number, cz: number, cl: number;
    do {
      cx = rng(seed + c * 17, 1) * 2 - 1;
      cy = rng(seed + c * 17, 2) * 2 - 1;
      cz = rng(seed + c * 17, 3) * 2 - 1;
      cl = Math.sqrt(cx * cx + cy * cy + cz * cz);
    } while (cl < 0.01);
    craters.push({
      nx: cx / cl, ny: cy / cl, nz: cz / cl,
      r:  CRATER_R_MIN + rng(seed + c * 17, 4) * (CRATER_R_MAX - CRATER_R_MIN),
      depthScale: 0.6 + rng(seed + c * 17, 5) * 0.8,
    });
  }

  const displaced = new Float32Array(count * 3);
  const colBuf    = new Float32Array(count * 3);
  const tmp       = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const x = src.getX(i), y = src.getY(i), z = src.getZ(i);
    const len = Math.sqrt(x * x + y * y + z * z);
    const nx = x / len, ny = y / len, nz = z / len; // unit sphere direction

    // FBM displacement (returns [0,1], mapped to [-1,1] by *2-1)
    // Power curve rounds off sharp peaks: |v|^1.5 * sign(v) pulls extremes toward 0
    const smooth = (v: number) => Math.sign(v) * Math.pow(Math.abs(v), 1.5);
    const large  = smooth(fbm(nx * 1.5, ny * 1.5, nz * 1.5, seed,        4, ROUGH_AMT) * 2 - 1);
    const medium = smooth(fbm(nx * 4,   ny * 4,   nz * 4,   seed + 999,  3, ROUGH_AMT) * 2 - 1);
    const small  = smooth(fbm(nx * 12,  ny * 12,  nz * 12,  seed + 2222, 2, ROUGH_AMT) * 2 - 1);
    let disp = 1 + large * BUMP_LG + medium * BUMP_MD + small * BUMP_SM;

    // Craters
    for (const cr of craters) {
      const dot     = nx * cr.nx + ny * cr.ny + nz * cr.nz;
      const angDist = Math.acos(Math.max(-1, Math.min(1, dot)));
      const d       = angDist / cr.r;
      if (d > 1 + CRATER_RIM_W + EJECTA * 0.5) continue;
      disp += craterProfile(d, CRATER_DP * cr.depthScale, CRATER_RIM, CRATER_RIM_W, CRATER_FLAT, EJECTA);
    }

    disp = Math.max(0.2, disp);

    // Elongation applied last — same order as the example
    displaced[i * 3]     = nx * disp * ELONG_X;
    displaced[i * 3 + 1] = ny * disp * ELONG_Y;
    displaced[i * 3 + 2] = nz * disp * ELONG_Z;

    // Vertex colour: map displacement to dark→mid→light
    const t = Math.min(1, Math.max(0, (disp - 0.7) / 0.8));
    t < 0.45
      ? tmp.lerpColors(COL_DARK, COL_MID,   t / 0.45)
      : tmp.lerpColors(COL_MID,  COL_LIGHT, (t - 0.45) / 0.55);
    colBuf[i * 3]     = tmp.r;
    colBuf[i * 3 + 1] = tmp.g;
    colBuf[i * 3 + 2] = tmp.b;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(displaced, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colBuf,    3));
  geo.computeVertexNormals();

  return geo;
}

// ── Per-instance state ────────────────────────────────────────────────────────

export interface AsteroidInstance {
  pos:       THREE.Vector3;
  rot:       THREE.Quaternion;
  spinAxis:  THREE.Vector3;
  spinSpeed: number;
  tumbleX:   number;
  tumbleZ:   number;
  scale:     number;
}

// ── LandingAsteroids ──────────────────────────────────────────────────────────

export class LandingAsteroids {

  private readonly _meshes:    THREE.InstancedMesh[]  = [];
  private readonly _instances: AsteroidInstance[][]   = [];
  private readonly _dummy  = new THREE.Object3D();

  get meshes():    readonly THREE.InstancedMesh[] { return this._meshes; }
  get instances(): readonly AsteroidInstance[][]  { return this._instances; }

  constructor(scene: THREE.Scene) {
    // Scene lighting lives in environment/landing/LandingEnvironment.ts —
    // asteroids only add their own meshes.
    const normalMap = buildRockNormalMap(1024);

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness:    MAT_ROUGH,
      metalness:    MAT_METAL,
      normalMap,
      normalScale:  new THREE.Vector2(1.2, 1.2),
    });

    const rand = makeRng(0xdeadbeef);

    for (let vi = 0; vi < VARIANTS; vi++) {
      const geo  = buildAsteroidGeo(vi);
      const mesh = new THREE.InstancedMesh(geo, material, PER_VARIANT);
      mesh.name  = `lp-asteroid-v${vi}`;
      scene.add(mesh);
      this._meshes.push(mesh);

      const instances: AsteroidInstance[] = [];

      for (let i = 0; i < PER_VARIANT; i++) {
        const theta = rand() * Math.PI * 2;
        const phi   = Math.acos(2 * rand() - 1);
        const r     = INNER_R + rand() * (OUTER_R - INNER_R);

        const pos = new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta) * 0.6,
          r * Math.cos(phi),
        );

        const spinAxis  = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
        const spinSpeed = (rand() * 0.7 + 0.3) * SPIN_SPD   * 0.016;
        const tumbleX   = (rand() - 0.5)        * TUMBLE_SPD * 0.016;
        const tumbleZ   = (rand() - 0.5)        * TUMBLE_SPD * 0.016;
        const scale     = MIN_SCALE + rand() * (MAX_SCALE - MIN_SCALE);

        const rot = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(rand() * Math.PI * 2, rand() * Math.PI * 2, rand() * Math.PI * 2),
        );

        instances.push({ pos, rot, spinAxis, spinSpeed, tumbleX, tumbleZ, scale });

        this._dummy.position.copy(pos);
        this._dummy.quaternion.copy(rot);
        this._dummy.scale.setScalar(scale);
        this._dummy.updateMatrix();
        mesh.setMatrixAt(i, this._dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      this._instances.push(instances);
    }
  }

  dispose(): void {
    this._meshes.forEach((m, i) => {
      m.geometry.dispose();
      if (i === 0) {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.normalMap?.dispose();
        mat.dispose();
      }
    });
  }
}
