// src/scripts/objects/solar-system/sun/SunSurface.ts

import * as THREE from 'three';
import { Geometry, ImageTexture, VectorMath, ShaderMath, Emission, MixRGB, Gamma, MapRange, Clamp } from '@triforge/shader-core';
import { RgbaOutput, UvPan, buildAcesToneMapNodes } from '../../../shader-nodes/CoreShaderNodes';
import type { PannableMaterial } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Sun surface — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   core  = sunTex * emissive(0xff8800) * intensity        // emissiveMap-driven
 *   rim   = 1.0 - dot(N, V)
 *   rgb   = mix(core, white, pow(rim, 1.5))                // white limb
 *   alpha = smoothstep(0.0, 0.02, dot(N, V))               // edge fade
 *
 * The original relied on renderer ACES tone mapping (exposure 2.0) to roll
 * emissiveIntensity 10.0 off to near-white — replicated in-graph with
 * buildAcesToneMapNodes, then Gamma(1/2.2) for the sRGB output encode.
 * No sun lighting needed — the sun lights itself.
 * Texture panning goes through a UvPan node (returned as `pan`) because
 * ShaderMaterials ignore THREE.Texture.offset.
 */
export function buildSunSurfaceMaterial(sunTexture: THREE.Texture): PannableMaterial {
  const geometry = new Geometry();

  const uvPan      = new UvPan();
  const surfaceTex = new ImageTexture({ uniformName: 'uSunTex', vector: uvPan.output('UV') });

  // emissive 0xff8800 × intensity 10 × toneMappingExposure 2.0
  const tinted  = new VectorMath({ mode: 'MULTIPLY', vector: surfaceTex.output('Color'), vectorB: [1.0, 2.5, 15.0] });
  const core    = new Emission({ color: tinted.output('Vector'), strength: 1.0 });
  const exposed = new VectorMath({ mode: 'SCALE', vector: core.output('BSDF'), scale: 2.0 });

  const toCamera  = new VectorMath({ mode: 'SCALE', vector: geometry.output('Incoming'), scale: -1 });
  const viewAngle = new VectorMath({ mode: 'DOT_PRODUCT', vector: geometry.output('Normal'), vectorB: toCamera.output('Vector') });
  const rim       = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: viewAngle.output('Value') });
  const rimCurve  = new ShaderMath({ mode: 'POWER', a: rim.output('Value'), b: 1.0 });

  const toneMapped = buildAcesToneMapNodes(exposed.output('Vector'));
  const encoded    = new Gamma({ color: toneMapped, gamma: 1.0 / 2.2 });
  const whitened   = new MixRGB({ mode: 'MIX', fac: rimCurve.output('Value'), colorA: encoded.output('Color'), colorB: '#ffffff' });

  // Edge fade — Clamp before MapRange (SMOOTHSTEP clamp-order bug workaround).
  const edgeBand = new Clamp({ value: viewAngle.output('Value'), min: 0.0, max: 0.02 });
  const alpha    = new MapRange({
    value: edgeBand.output('Result'),
    fromMin: 0.0, fromMax: 0.02,
    toMin: 0.0, toMax: 1.0,
    mode: 'SMOOTHSTEP', clamp: true,
  });

  const out = new RgbaOutput({ color: whitened.output('Color'), alpha: alpha.output('Result') });
  out.compile();

  out.material!.transparent = true;
  out.material!.uniforms['uSunTex'] = { value: sunTexture };

  return { material: out.material!, pan: uvPan.parameters as Record<string, number> };
}
