// src/scripts/shader-nodes/CoreShaderNodes.ts

import {
  OutputNode,
  ProcessNode,
  Geometry,
  CameraData,
  VectorMath,
  MapRange,
  Clamp,
  ShaderMath,
  SeparateRGB,
  CombineRGB,
} from '@triforge/shader-core';
import type { CompileContext, OutputSocket, InputSocket } from '@triforge/shader-core';

interface RgbaOutputInputs {
  color: OutputSocket;
  alpha: OutputSocket | number;
}

/**
 * Terminal node with per-fragment alpha — MaterialOutput hardcodes alpha to 1.0,
 * which cannot express fresnel- or terminator-driven transparency.
 */
export class RgbaOutput extends OutputNode {
  get nodeType(): string { return 'RgbaOutput'; }
  get metadata() {
    return { label: 'RGBA Output', category: 'Output', color: '#a06030', cost: 'low' as const };
  }

  private readonly _inputs: Record<string, InputSocket<unknown>>;

  constructor(inputs: RgbaOutputInputs) {
    super('RgbaOutput');
    this._inputs = this.createInputs(inputs as unknown as Record<string, unknown>, {
      color: ['color', [0, 0, 0], true],
      alpha: ['float', 1.0],
    });
  }

  getInputSockets(): Record<string, InputSocket<unknown>> { return this._inputs; }

  compileCall(ctx: CompileContext): string {
    const color = ctx.resolveInput(this._inputs['color']);
    const alpha = ctx.resolveInput(this._inputs['alpha']);
    return `gl_FragColor = vec4(${color}, ${alpha});`;
  }
}

export interface PannableMaterial {
  material: import('three').ShaderMaterial;
  /** Live UV-offset uniforms ({ x, y }) — keyframe these instead of map.offset. */
  pan: Record<string, number>;
}

interface UvPanInputs {
  x?: number;
  y?: number;
}

/**
 * UV offset node — replaces THREE.Texture.offset panning, which raw
 * ShaderMaterials ignore. No triforge node can do this: `vector` sockets are
 * vec2 but every transform node (incl. Mapping) outputs vec3 `color`, so
 * nothing can legally feed ImageTexture.vector. x/y are float inputs →
 * live uniforms, animatable via node.parameters after compile()
 * (keyframe-compatible, replaces map.offset tracks).
 */
export class UvPan extends ProcessNode {
  get nodeType(): string { return 'UvPan'; }
  get metadata() {
    return { label: 'UV Pan', category: 'Vector', color: '#4a3a8a', cost: 'low' as const };
  }

  private readonly _inputs: Record<string, InputSocket<unknown>>;
  private readonly _outputs: Record<string, OutputSocket>;

  constructor(inputs: UvPanInputs = {}) {
    super('UvPan');
    this._inputs = this.createInputs(inputs as unknown as Record<string, unknown>, {
      x: ['float', inputs.x ?? 0.0],
      y: ['float', inputs.y ?? 0.0],
    });
    this._outputs = this.createOutputs({ UV: 'vector' });
  }

  getInputSockets(): Record<string, InputSocket<unknown>> { return this._inputs; }
  getOutputSockets(): Record<string, OutputSocket> { return this._outputs; }

  compileDefs(): string { return ''; }

  compileCall(ctx: CompileContext): string {
    const x = ctx.resolveInput(this._inputs['x']);
    const y = ctx.resolveInput(this._inputs['y']);
    return `vec2 ${ctx.outputVar(this, 'UV')} = vUv + vec2(${x}, ${y});`;
  }
}

interface TextureBumpInputs {
  /** sampler2D uniform name — must NOT collide with an ImageTexture uniform;
   *  assign the texture on material.uniforms[uniformName] after compile(). */
  uniformName: string;
  /** UV source; defaults to vUv. */
  vector?: OutputSocket;
  strength?: OutputSocket | number;
  distance?: OutputSocket | number;
  /** Finite-difference offset in UV units (≈ 1–2 texels of the height texture). */
  texelSize?: OutputSocket | number;
  /** Mip level to sample height from — higher = smoother height field
   *  (pre-averaged by mipmapping), killing per-texel noise in the relief. */
  lod?: OutputSocket | number;
  /** Base normal to perturb — chain another TextureBump's Normal output here
   *  for multi-octave relief. Defaults to the geometry normal. */
  normal?: OutputSocket;
}

/**
 * Texture bump via UV-space finite differences — replaces the stock Bump
 * node, whose dFdx/dFdy height derivatives are unstable at both extremes:
 * speckle at minification (far) and texel-seam flicker at magnification
 * (near). Sampling the height texture at uv ± texelSize gives a gradient
 * that is independent of screen sampling — stable under camera motion.
 * Height = RGBtoBW luminance of the sample; tangent frame and
 * strength × distance × 50 scaling match the stock Bump node, so existing
 * tuned values carry over unchanged.
 */
export class TextureBump extends ProcessNode {
  get nodeType(): string { return 'TextureBump'; }
  get metadata() {
    return { label: 'Texture Bump', category: 'Vector', color: '#4a3a8a', cost: 'medium' as const };
  }

  static instanceSpecificDef = true;

  readonly uniformName: string;
  private readonly _inputs: Record<string, InputSocket<unknown>>;
  private readonly _outputs: Record<string, OutputSocket>;

  constructor(inputs: TextureBumpInputs) {
    super('TextureBump');
    this.uniformName = inputs.uniformName;
    this._inputs = this.createInputs(inputs as unknown as Record<string, unknown>, {
      vector:    ['vector', null],
      strength:  ['float', typeof inputs.strength === 'number' ? inputs.strength : 1.0],
      distance:  ['float', typeof inputs.distance === 'number' ? inputs.distance : 1.0],
      texelSize: ['float', typeof inputs.texelSize === 'number' ? inputs.texelSize : 1.0 / 512.0],
      lod:       ['float', typeof inputs.lod === 'number' ? inputs.lod : 3.0],
      normal:    ['color', null],
    });
    this._outputs = this.createOutputs({ Normal: 'color' });
  }

  getInputSockets(): Record<string, InputSocket<unknown>> { return this._inputs; }
  getOutputSockets(): Record<string, OutputSocket> { return this._outputs; }

  compileDefs(): string {
    return `uniform sampler2D ${this.uniformName};
vec3 _ex_textureBump_${this.id}(vec2 uv, float eps, float strength, float distance, float lod, vec3 N) {
  // texture2DLodEXT → textureLod on WebGL2 (three.js compatibility define).
  // Sampling an explicit mip gives a pre-averaged, noise-free height field.
  float hpu = dot(texture2DLodEXT(${this.uniformName}, uv + vec2(eps, 0.0), lod).rgb, vec3(0.2126, 0.7152, 0.0722));
  float hmu = dot(texture2DLodEXT(${this.uniformName}, uv - vec2(eps, 0.0), lod).rgb, vec3(0.2126, 0.7152, 0.0722));
  float hpv = dot(texture2DLodEXT(${this.uniformName}, uv + vec2(0.0, eps), lod).rgb, vec3(0.2126, 0.7152, 0.0722));
  float hmv = dot(texture2DLodEXT(${this.uniformName}, uv - vec2(0.0, eps), lod).rgb, vec3(0.2126, 0.7152, 0.0722));

  // Height gradient in UV space — finite differences, screen-independent
  float dhdu = (hpu - hmu) / (2.0 * eps);
  float dhdv = (hpv - hmv) / (2.0 * eps);

  // World-space tangent and bitangent from UV Jacobian (cotangent frame,
  // derivatives of smooth varyings only — stable)
  vec3 dPdx = dFdx(vPosition);
  vec3 dPdy = dFdy(vPosition);
  vec2 dUdx = dFdx(vUv);
  vec2 dUdy = dFdy(vUv);
  float det    = dUdx.x * dUdy.y - dUdx.y * dUdy.x;
  float sgn    = sign(det);
  float invDet = sgn / max(abs(det), 1e-6);
  vec3 T = normalize((dUdy.y * dPdx - dUdx.y * dPdy) * invDet);
  vec3 B = normalize(cross(N, T)) * sgn;

  float scale = strength * distance * 50.0;
  return normalize(N - T * dhdu * scale - B * dhdv * scale);
}`;
  }

  compileCall(ctx: CompileContext): string {
    const uv = this._inputs['vector']!.connection
      ? ctx.outputVar(this._inputs['vector']!.connection!.node, this._inputs['vector']!.connection!.name)
      : 'vUv';
    const strength = ctx.resolveInput(this._inputs['strength']);
    const distance = ctx.resolveInput(this._inputs['distance']);
    const texel    = ctx.resolveInput(this._inputs['texelSize']);
    const lod      = ctx.resolveInput(this._inputs['lod']);
    const normal   = this._inputs['normal']!.connection
      ? ctx.outputVar(this._inputs['normal']!.connection!.node, this._inputs['normal']!.connection!.name)
      : 'normalize(vNormal)';
    return `vec3 ${ctx.outputVar(this, 'Normal')} = _ex_textureBump_${this.id}(${uv}, ${texel}, ${strength}, ${distance}, ${lod}, ${normal});`;
  }
}

export interface BumpFadeConfig {
  /** Bump strength at close range. */
  strength: number;
  /** Camera distance where the fade begins (full strength below this). */
  fadeStart: number;
  /** Camera distance where bump reaches zero. */
  fadeEnd: number;
}

/**
 * Distance-faded bump strength — feeds Bump.strength so relief dissolves
 * before the range where dFdx/dFdy derivative aliasing produces speckle
 * artifacts (adjacent pixels sampling far-apart texels at minification).
 * At those distances bump detail is sub-pixel anyway, so nothing is lost.
 */
export function buildBumpFadeStrength(config: BumpFadeConfig): OutputSocket {
  const camera = new CameraData();
  const band   = new Clamp({ value: camera.output('ViewDistance'), min: config.fadeStart, max: config.fadeEnd });
  const fade   = new MapRange({
    value: band.output('Result'),
    fromMin: config.fadeStart, fromMax: config.fadeEnd,
    toMin: config.strength, toMax: 0.0,
    mode: 'SMOOTHSTEP', clamp: false,
  });
  return fade.output('Result');
}

/**
 * ACES filmic tone mapping (Narkowicz approximation) as a node sub-graph:
 *
 *   aces(x) = clamp((x * (2.51x + 0.03)) / (x * (2.43x + 0.59) + 0.14), 0, 1)
 *
 * Applied per channel. Replicates the highlight roll-off + desaturation the
 * original MeshStandardMaterial pipeline got from renderer.toneMapping —
 * without it, high emissive intensities clip to flat saturated colour.
 */
export function buildAcesToneMapNodes(color: OutputSocket): OutputSocket {
  const split = new SeparateRGB({ color });

  const channel = (c: OutputSocket): OutputSocket => {
    const numInner = new ShaderMath({ mode: 'MULTIPLY', a: c, b: 2.51 });
    const numTerm  = new ShaderMath({ mode: 'ADD', a: numInner.output('Value'), b: 0.03 });
    const num      = new ShaderMath({ mode: 'MULTIPLY', a: c, b: numTerm.output('Value') });
    const denInner = new ShaderMath({ mode: 'MULTIPLY', a: c, b: 2.43 });
    const denTerm  = new ShaderMath({ mode: 'ADD', a: denInner.output('Value'), b: 0.59 });
    const denMul   = new ShaderMath({ mode: 'MULTIPLY', a: c, b: denTerm.output('Value') });
    const den      = new ShaderMath({ mode: 'ADD', a: denMul.output('Value'), b: 0.14 });
    const mapped   = new ShaderMath({ mode: 'DIVIDE', a: num.output('Value'), b: den.output('Value') });
    const clamped  = new Clamp({ value: mapped.output('Value'), min: 0.0, max: 1.0 });
    return clamped.output('Result');
  };

  const combined = new CombineRGB({
    r: channel(split.output('R')),
    g: channel(split.output('G')),
    b: channel(split.output('B')),
  });

  return combined.output('Color');
}

export interface TerminatorConfig {
  fromMin: number;
  fromMax: number;
}

export interface TerminatorNodes {
  geometry: Geometry;
  terminator: OutputSocket;
}

/**
 * Day/night terminator sub-graph — node port of the original GLSL:
 *
 *   sunDir     = normalize(vec3(0.0) - vWorldPos)   // sun at scene origin
 *   terminator = smoothstep(fromMin, fromMax, dot(vWorldNormal, sunDir))
 *
 * MapRange applies its SMOOTHSTEP polynomial before clamping, so out-of-band
 * values invert (night → 1, day → 0). Clamp into the band first.
 */
export function buildTerminatorNodes(config: TerminatorConfig): TerminatorNodes {
  const geometry = new Geometry();

  const toSun      = new VectorMath({ mode: 'SCALE', vector: geometry.output('Position'), scale: -1 });
  const sunDir     = new VectorMath({ mode: 'NORMALIZE', vector: toSun.output('Vector') });
  const shadow     = new VectorMath({ mode: 'DOT_PRODUCT', vector: geometry.output('Normal'), vectorB: sunDir.output('Vector') });
  const shadowBand = new Clamp({ value: shadow.output('Value'), min: config.fromMin, max: config.fromMax });
  const terminator = new MapRange({
    value: shadowBand.output('Result'),
    fromMin: config.fromMin, fromMax: config.fromMax,
    toMin: 0.0, toMax: 1.0,
    mode: 'SMOOTHSTEP', clamp: true,
  });

  return { geometry, terminator: terminator.output('Result') };
}
