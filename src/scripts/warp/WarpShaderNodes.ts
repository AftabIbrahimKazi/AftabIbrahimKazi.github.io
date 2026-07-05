// src/scripts/warp/WarpShaderNodes.ts
// Triforge port of the warp star-field shader.
//
// The star field itself is a 16-layer × 3×3-cell raymarch loop — a node graph
// cannot express loops, so the loop lives inside WarpStarfield, a custom node
// (same pattern as TextureBump in CoreShaderNodes). Everything downstream of
// the loop — core glow, tunnel vignette, chromatic fringe, veil — is a genuine
// node graph in buildWarpMaterial().
//
// All six animated uniforms (speed, time, aspect, opacity, fade, color) are
// unconnected inputs on the WarpStarfield node, so node.parameters is a 1:1
// replacement for the old ShaderMaterial uniforms block. opacity/fade are not
// used inside the star-field function — they pass through as outputs so the
// veil sub-graph shares the same live uniforms.

import * as THREE from 'three';
import {
  ProcessNode,
  ShaderMath,
  VectorMath,
  MapRange,
  Clamp,
  SeparateRGB,
  CombineRGB,
} from '@triforge/shader-core';
import type { CompileContext, OutputSocket, InputSocket } from '@triforge/shader-core';
import { RgbaOutput } from '../shader-nodes/CoreShaderNodes';

interface WarpStarfieldInputs {
  speed?:   number;
  time?:    number;
  aspect?:  number;
  opacity?: number;
  fade?:    number;
  color?:   [number, number, number];
}

/**
 * Perspective warp star field. Stars live at world positions on a repeating
 * layer grid; the camera flies forward along Z and each star is projected via
 * perspective division. The trail is the segment between the star's current
 * and previous screen positions — near stars fly fast (long trails), far
 * stars barely move. Emitted GLSL is the original WarpTransition shader loop,
 * verbatim.
 *
 * Outputs: Color (summed star RGB), Lum (summed luminance), Radius (screen
 * distance from centre, aspect-corrected), RadiusNorm (Radius / aspect), and
 * Speed / Opacity / Fade uniform passthroughs for the composition graph.
 */
export class WarpStarfield extends ProcessNode {
  get nodeType(): string { return 'WarpStarfield'; }
  get metadata() {
    return { label: 'Warp Starfield', category: 'Texture', color: '#203a6a', cost: 'high' as const };
  }

  private readonly _inputs: Record<string, InputSocket<unknown>>;
  private readonly _outputs: Record<string, OutputSocket>;

  constructor(inputs: WarpStarfieldInputs = {}) {
    super('WarpStarfield');
    this._inputs = this.createInputs(inputs as unknown as Record<string, unknown>, {
      speed:   ['float', inputs.speed   ?? 0.0],
      time:    ['float', inputs.time    ?? 0.0],
      aspect:  ['float', inputs.aspect  ?? 1.0],
      opacity: ['float', inputs.opacity ?? 0.0],
      fade:    ['float', inputs.fade    ?? 1.0],
      color:   ['color', inputs.color   ?? [1.0, 0.95, 0.78]],
    });
    this._outputs = this.createOutputs({
      Color:      'color',
      Tint:       'color',
      Lum:        'float',
      Radius:     'float',
      RadiusNorm: 'float',
      Speed:      'float',
      Opacity:    'float',
      Fade:       'float',
    });
  }

  getInputSockets(): Record<string, InputSocket<unknown>> { return this._inputs; }
  getOutputSockets(): Record<string, OutputSocket> { return this._outputs; }

  compileDefs(): string {
    return `
vec3 _ex_warpHash33(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}

const float _EX_WARP_FOCAL          = 1.1;   // camera focal length
const float _EX_WARP_CELL           = 0.75;  // world-space grid cell size per layer
const float _EX_WARP_LAYER_SPACING  = 3.2;   // z-gap between star layers
const int   _EX_WARP_LAYERS         = 16;    // number of depth layers
const float _EX_WARP_FADE_NEAR      = 0.4;   // clip stars closer than this
const float _EX_WARP_FADE_FAR_RATIO = 0.92;  // clip the very back to avoid pop-in

// Returns vec4(rgb colour sum, total luminance).
vec4 _ex_warpStars(vec2 pUv, float speed, float time, vec3 tint) {

  // Camera motion — slow ambient drift + warp burst. Quadratic so it really
  // kicks at high speed.
  float camZ    = time * 0.06 + speed * speed * 4.5;
  float trailDZ = speed * speed * 0.9; // how far back the trail reaches in z

  vec3  col      = vec3(0.0);
  float totalLum = 0.0;
  float cycleLen = float(_EX_WARP_LAYERS) * _EX_WARP_LAYER_SPACING;

  for (int li = 0; li < _EX_WARP_LAYERS; li++) {

    // Effective z of this layer after camera movement (cycled so layers repeat)
    float baseZ      = float(li) * _EX_WARP_LAYER_SPACING + 1.8;
    float effectiveZ = mod(baseZ - camZ, cycleLen);

    // Skip stars too close (singularity) or too far (pop-in)
    if (effectiveZ < _EX_WARP_FADE_NEAR) continue;
    if (effectiveZ > cycleLen * _EX_WARP_FADE_FAR_RATIO) continue;

    // Project this pixel's ray to world space at this depth
    vec2 hitWorld = pUv * effectiveZ / _EX_WARP_FOCAL;

    // 3×3 cell neighbourhood (so trails crossing cell edges still render)
    vec2 cellBase = floor(hitWorld / _EX_WARP_CELL);

    for (float cx = -1.0; cx <= 1.0; cx++) {
      for (float cy = -1.0; cy <= 1.0; cy++) {
        vec2 cell = cellBase + vec2(cx, cy);

        // Unique random per (cell, layer)
        vec3 rnd = _ex_warpHash33(vec3(cell, float(li) * 7.391));

        // Star world-space XY (constant — only z changes as camera moves)
        vec2 starXY = (cell + rnd.xy) * _EX_WARP_CELL;

        // Current and previous screen positions — prevZ > effectiveZ means the
        // star was further away, so it appeared closer to centre
        vec2  starNow  = starXY / effectiveZ * _EX_WARP_FOCAL;
        float prevZ    = effectiveZ + trailDZ;
        vec2  starPrev = starXY / prevZ * _EX_WARP_FOCAL;

        // Trail vector: from starPrev (tail, near centre) to starNow (head, outer)
        vec2  trail    = starNow - starPrev;
        float trailLen = length(trail);

        float brightness = rnd.z * 0.7 + 0.3;

        // Closer stars are dramatically brighter (inverse square-ish)
        float depthBright = 1.8 / (effectiveZ * 0.15 + 0.25);

        // Star width — thinner in world terms for distant stars
        float sw = (0.0012 + 0.0008 * brightness);

        // Rasterise: distance from pixel to trail segment
        float starVal = 0.0;

        if (trailLen < 0.0008) {
          // No movement — render as a dot
          starVal = smoothstep(sw, 0.0, length(pUv - starNow));

        } else {
          vec2  tN    = trail / trailLen;
          vec2  tPerp = vec2(-tN.y, tN.x);
          vec2  rel   = pUv - starPrev;

          float along = dot(rel, tN);
          float perp  = dot(rel, tPerp);

          // Pixel must be within the segment (with a little cap at each end)
          if (along > -sw * 0.5 && along < trailLen + sw) {
            float perpFade = smoothstep(sw, 0.0, abs(perp));

            // Brightness ramp: full at head (starNow), fades toward tail (starPrev)
            float headRamp = smoothstep(0.0, min(trailLen * 0.6, 0.04), along);

            // Extra cap glow at the very head
            float capGlow  = smoothstep(sw * 2.0, 0.0, abs(along - trailLen));

            starVal = perpFade * (headRamp * 0.85 + capGlow * 0.6);
          }
        }

        // Star colour: blue-white for most, warm yellow for bright giants
        vec3 starColor;
        if (rnd.z > 0.88) {
          starColor = vec3(1.0, 0.93, 0.70);                    // warm yellow giant
        } else if (rnd.z > 0.70) {
          starColor = mix(vec3(1.0, 0.98, 0.92), tint, 0.15);   // warm white + colour tint
        } else {
          starColor = mix(vec3(0.98, 0.96, 0.92), tint, 0.25);  // white + stronger colour tint
        }

        float contrib  = starVal * brightness * depthBright;
        col           += starColor * contrib;
        totalLum      += contrib;
      }
    }
  }

  return vec4(col, totalLum);
}`;
  }

  compileCall(ctx: CompileContext): string {
    const speed   = ctx.resolveInput(this._inputs['speed']);
    const time    = ctx.resolveInput(this._inputs['time']);
    const aspect  = ctx.resolveInput(this._inputs['aspect']);
    const opacity = ctx.resolveInput(this._inputs['opacity']);
    const fade    = ctx.resolveInput(this._inputs['fade']);
    const color   = ctx.resolveInput(this._inputs['color']);

    const outColor      = ctx.outputVar(this, 'Color');
    const outTint       = ctx.outputVar(this, 'Tint');
    const outLum        = ctx.outputVar(this, 'Lum');
    const outRadius     = ctx.outputVar(this, 'Radius');
    const outRadiusNorm = ctx.outputVar(this, 'RadiusNorm');
    const outSpeed      = ctx.outputVar(this, 'Speed');
    const outOpacity    = ctx.outputVar(this, 'Opacity');
    const outFade       = ctx.outputVar(this, 'Fade');

    return `vec2 _ex_warpPuv = (vUv - 0.5) * vec2(${aspect}, 1.0);
vec4 _ex_warpSf = _ex_warpStars(_ex_warpPuv, ${speed}, ${time}, ${color});
vec3 ${outColor} = _ex_warpSf.rgb;
vec3 ${outTint} = ${color};
float ${outLum} = _ex_warpSf.a;
float ${outRadius} = length(_ex_warpPuv);
float ${outRadiusNorm} = ${outRadius} / ${aspect};
float ${outSpeed} = ${speed};
float ${outOpacity} = ${opacity};
float ${outFade} = ${fade};`;
  }
}

export interface WarpMaterialHandle {
  material: THREE.ShaderMaterial;
  /** Live uniforms: speed, time, aspect, opacity, fade (floats) + color ([r,g,b]). */
  parameters: Record<string, number | [number, number, number]>;
}

/** smoothstep(edge0, edge1, value) as nodes — Clamp before MapRange (clamp-order bug workaround). */
function buildSmoothstep(value: OutputSocket, edge0: number, edge1: number, toMin = 0.0, toMax = 1.0): OutputSocket {
  const band = new Clamp({ value, min: edge0, max: edge1 });
  const step = new MapRange({
    value: band.output('Result'),
    fromMin: edge0, fromMax: edge1,
    toMin, toMax,
    mode: 'SMOOTHSTEP', clamp: true,
  });
  return step.output('Result');
}

/**
 * Full warp material — WarpStarfield node + composition graph:
 *
 *   glow   = smoothstep(0.55, 0.0, r) * speed² * 1.1        // central core glow
 *   col    = stars + tint * glow
 *   col   *= 1.0 - smoothstep(0.38, 0.82, r/ar) * speed * 0.55   // tunnel vignette
 *   col.r += fringe * 0.06;  col.b -= fringe * 0.04              // chromatic fringe
 *   col   *= (1 - opacity) * fade                                // veil
 *   alpha  = clamp((lum * 2.5 + glow * 0.8) * fade + opacity, 0, 1)
 */
export function buildWarpMaterial(aspect: number): WarpMaterialHandle {
  const stars = new WarpStarfield({ aspect });

  // Central core glow (builds at warp peak)
  const glowBase = buildSmoothstep(stars.output('Radius'), 0.0, 0.55, 1.0, 0.0);
  const speedSq  = new ShaderMath({ mode: 'MULTIPLY', a: stars.output('Speed'), b: stars.output('Speed') });
  const glowPeak = new ShaderMath({ mode: 'MULTIPLY', a: glowBase, b: speedSq.output('Value') });
  const glow     = new ShaderMath({ mode: 'MULTIPLY', a: glowPeak.output('Value'), b: 1.1 });

  const tintGlow = new VectorMath({ mode: 'SCALE', vector: stars.output('Tint'), scale: glow.output('Value') });
  const colGlow  = new VectorMath({ mode: 'ADD', vector: stars.output('Color'), vectorB: tintGlow.output('Vector') });

  // Tunnel vignette — edges darken as speed rises
  const edgeDark  = buildSmoothstep(stars.output('RadiusNorm'), 0.38, 0.82);
  const darkSpeed = new ShaderMath({ mode: 'MULTIPLY', a: edgeDark, b: stars.output('Speed') });
  const darkAmt   = new ShaderMath({ mode: 'MULTIPLY', a: darkSpeed.output('Value'), b: 0.55 });
  const darkMul   = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: darkAmt.output('Value') });
  const colDark   = new VectorMath({ mode: 'SCALE', vector: colGlow.output('Vector'), scale: darkMul.output('Value') });

  // Chromatic aberration fringe on outer ring
  const fringeBase = buildSmoothstep(stars.output('RadiusNorm'), 0.3, 0.75);
  const fringe     = new ShaderMath({ mode: 'MULTIPLY', a: fringeBase, b: stars.output('Speed') });
  const fringeR    = new ShaderMath({ mode: 'MULTIPLY', a: fringe.output('Value'), b: 0.06 });
  const fringeB    = new ShaderMath({ mode: 'MULTIPLY', a: fringe.output('Value'), b: 0.04 });

  const split   = new SeparateRGB({ color: colDark.output('Vector') });
  const rShift  = new ShaderMath({ mode: 'ADD',      a: split.output('R'), b: fringeR.output('Value') });
  const bShift  = new ShaderMath({ mode: 'SUBTRACT', a: split.output('B'), b: fringeB.output('Value') });
  const fringed = new CombineRGB({ r: rShift.output('Value'), g: split.output('G'), b: bShift.output('Value') });

  // Veil — fade to/from black
  const invOpacity = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: stars.output('Opacity') });
  const veilMul    = new ShaderMath({ mode: 'MULTIPLY', a: invOpacity.output('Value'), b: stars.output('Fade') });
  const colFinal   = new VectorMath({ mode: 'SCALE', vector: fringed.output('Color'), scale: veilMul.output('Value') });

  // alpha = clamp((lum * 2.5 + glow * 0.8) * fade + opacity, 0, 1)
  const lumTerm   = new ShaderMath({ mode: 'MULTIPLY', a: stars.output('Lum'), b: 2.5 });
  const glowTerm  = new ShaderMath({ mode: 'MULTIPLY', a: glow.output('Value'), b: 0.8 });
  const alphaSum  = new ShaderMath({ mode: 'ADD', a: lumTerm.output('Value'), b: glowTerm.output('Value') });
  const alphaFade = new ShaderMath({ mode: 'MULTIPLY', a: alphaSum.output('Value'), b: stars.output('Fade') });
  const alphaVeil = new ShaderMath({ mode: 'ADD', a: alphaFade.output('Value'), b: stars.output('Opacity') });
  const alpha     = new Clamp({ value: alphaVeil.output('Value'), min: 0.0, max: 1.0 });

  const out = new RgbaOutput({ color: colFinal.output('Vector'), alpha: alpha.output('Result') });
  out.compile();

  out.material!.transparent = true;
  out.material!.depthTest   = false;

  return { material: out.material!, parameters: stars.parameters };
}
