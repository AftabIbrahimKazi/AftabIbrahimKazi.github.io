// src/scripts/objects/landing/CarouselPlanetMaterials.ts
// Triforge node-graph materials for the landing carousel mini-scenes —
// replaces the last raw GLSL in the landing domain (CarouselPlanets.ts
// atmoVert/atmoFrag + the carousel sun onBeforeCompile injection).

import * as THREE from 'three';
import { Geometry, ImageTexture, VectorMath, ShaderMath, Emission, MixRGB, Gamma, MapRange, Clamp } from '@triforge/shader-core';
import { RgbaOutput, buildAcesToneMapNodes } from '../../shader-nodes/CoreShaderNodes';

/**
 * Fresnel atmosphere rim for carousel planets — node port of the original GLSL:
 *
 *   fresnel = pow(1.0 - dot(N, V), 5.0)
 *   rgb     = uColor * fresnel * uIntensity
 *   alpha   = fresnel
 *
 * No terminator term — the carousel mini-scenes are lit by their own
 * DirectionalLight, not the solar-system sun-at-origin convention.
 */
export function buildCarouselAtmosphereMaterial(color: THREE.Color, intensity: number): THREE.ShaderMaterial {
  const geometry = new Geometry();

  const toCamera  = new VectorMath({ mode: 'SCALE', vector: geometry.output('Incoming'), scale: -1 });
  const viewAngle = new VectorMath({ mode: 'DOT_PRODUCT', vector: geometry.output('Normal'), vectorB: toCamera.output('Vector') });
  const grazing   = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: viewAngle.output('Value') });
  const fresnel   = new ShaderMath({ mode: 'POWER', a: grazing.output('Value'), b: 5.0 });

  const strength  = new ShaderMath({ mode: 'MULTIPLY', a: fresnel.output('Value'), b: intensity });
  const glow      = new Emission({ color: [color.r, color.g, color.b] as unknown as string, strength: strength.output('Value') });

  const out = new RgbaOutput({ color: glow.output('BSDF'), alpha: fresnel.output('Value') });
  out.compile();

  out.material!.transparent = true;
  out.material!.depthWrite  = false;
  out.material!.side        = THREE.FrontSide;
  out.material!.blending    = THREE.AdditiveBlending;

  return out.material!;
}

/**
 * Carousel sun — node port of the original MeshStandardMaterial +
 * onBeforeCompile injection:
 *
 *   core  = sunTex * emissive(0xff8800) * 8.0                 // emissiveMap-driven
 *   rim   = 1.0 - dot(N, V)
 *   rgb   = mix(core, white, pow(rim, 1.5))                   // white limb
 *   alpha = smoothstep(0.0, 0.02, dot(N, V))                  // edge fade
 *
 * The original relied on renderer ACES tone mapping (exposure 1.4), which raw
 * ShaderMaterials bypass — replicated in-graph like SunSurface.ts.
 */
export function buildCarouselSunMaterial(sunTexture: THREE.Texture): THREE.ShaderMaterial {
  const geometry = new Geometry();

  const surfaceTex = new ImageTexture({ uniformName: 'uCarouselSunTex' });

  // emissive 0xff8800 × intensity 8 × toneMappingExposure 1.4
  const tinted = new VectorMath({ mode: 'MULTIPLY', vector: surfaceTex.output('Color'), vectorB: [11.2, 5.97, 0.0] });
  const core   = new Emission({ color: tinted.output('Vector'), strength: 1.0 });

  const toCamera  = new VectorMath({ mode: 'SCALE', vector: geometry.output('Incoming'), scale: -1 });
  const viewAngle = new VectorMath({ mode: 'DOT_PRODUCT', vector: geometry.output('Normal'), vectorB: toCamera.output('Vector') });
  const rim       = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: viewAngle.output('Value') });
  const rimCurve  = new ShaderMath({ mode: 'POWER', a: rim.output('Value'), b: 1.5 });

  const toneMapped = buildAcesToneMapNodes(core.output('BSDF'));
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
  out.material!.uniforms['uCarouselSunTex'] = { value: sunTexture };

  return out.material!;
}
