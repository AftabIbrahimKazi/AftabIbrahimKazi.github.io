// src/scripts/shader-nodes/CoreShaderNodes.ts

import {
  Geometry,
  CameraData,
  VectorMath,
  MapRange,
  Clamp,
  ShaderMath,
  SeparateRGB,
  CombineRGB,
  Mapping,
  TextureCoordinate,
} from '@triforge/shader-core';
import type { OutputSocket } from '@triforge/shader-core';

export interface PannableMaterial {
  material: import('three').ShaderMaterial;
  /** Live UV-offset uniforms ({ x, y }) — keyframe these instead of map.offset. */
  pan: Record<string, number>;
}

export interface UvPanHandle {
  /** Feed into ImageTexture.vector — vec3 Mapping output narrows to vec2 at the connection point. */
  vector: OutputSocket;
  /** Live { x, y } — keyframe these exactly like the old UvPan node's parameters. */
  pan: Record<string, number>;
}

/**
 * UV offset via the canonical TextureCoordinate → Mapping graph (shader-core
 * 0.2.1+, finding #2 resolved: vector/color sockets now implicitly convert at
 * connection points) plus 0.4.0's per-component parameter aliases (finding #8
 * resolved: `parameters['location.x']` is now a live single-axis uniform,
 * animatable via KeyframeTrack — the old project-local UvPan node existed
 * only because neither fix had shipped yet).
 *
 * Mapping computes `vector - location`; the old UvPan computed `vUv + vec2(x, y)`.
 * This wrapper negates on read/write so `pan.x`/`pan.y` keep the exact same
 * sign convention external callers (KeyframeTrack in *Animation.ts) already
 * depend on — zero changes needed at call sites.
 */
export function buildUvPan(): UvPanHandle {
  const mapping = new Mapping({ vector: new TextureCoordinate().output('UV') });
  const pan: Record<string, number> = {};
  Object.defineProperties(pan, {
    x: {
      enumerable: true,
      // location.x is a per-axis alias onto a vec3 uniform — shader-core types
      // parameters as a union across all node kinds; this node's axis aliases are
      // always float-valued.
      get: () => -(mapping.parameters['location.x'] as number),
      set: (v: number) => { mapping.parameters['location.x'] = -v; },
    },
    y: {
      enumerable: true,
      // See location.x above — same axis-alias/float guarantee.
      get: () => -(mapping.parameters['location.y'] as number),
      set: (v: number) => { mapping.parameters['location.y'] = -v; },
    },
  });
  return { vector: mapping.output('Vector'), pan };
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

export interface NightAmbientConfig {
  /** Surface texture colour socket (ImageTexture.Color) — night side shows its dim detail. */
  color: OutputSocket;
  /** Terminator socket from buildTerminatorNodes (1 = day, 0 = night). */
  terminator: OutputSocket;
  /** Ambient strength on the night side. Default 0.05. */
  strength?: number;
}

/**
 * Night-side ambient fill — restores the dim texture-lit night hemisphere the
 * planets had as MeshStandardMaterials receiving the scene AmbientLight.
 * PrincipledBSDF's uAmbientColor uniform (shader-core 0.3.0+) cannot do this
 * here: the surface graphs multiply the whole lit result by the terminator,
 * which zeroes any in-BSDF ambient exactly where it is needed. This chain adds
 * `texture × strength × (1 − terminator)` after the terminator multiply, so
 * the night side reads as dim surface detail instead of pitch black.
 */
export function buildNightAmbient(config: NightAmbientConfig): OutputSocket {
  const nightBlend = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: config.terminator });
  const dimmed     = new VectorMath({ mode: 'SCALE', vector: config.color, scale: config.strength ?? 0 });
  const night      = new VectorMath({ mode: 'SCALE', vector: dimmed.output('Vector'), scale: nightBlend.output('Value') });
  return night.output('Vector');
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
