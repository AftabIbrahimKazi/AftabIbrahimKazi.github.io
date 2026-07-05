// src/scripts/objects/solar-system/earth/EarthNight.ts

import * as THREE from 'three';
import { ImageTexture, ShaderMath, Gamma, Emission } from '@triforge/shader-core';
import { RgbaOutput, buildTerminatorNodes } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Earth night-lights layer — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   nightBlend = 1.0 - terminator
 *   rgb        = nightTex * nightBlend
 *   alpha      = 0.75 * nightBlend        // material opacity × nightBlend
 *
 * The Gamma node re-encodes the linear texture sample to approximate the
 * sRGB output conversion the standard material pipeline performed.
 */
export function buildEarthNightMaterial(nightTexture: THREE.Texture): THREE.ShaderMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const nightBlend = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: terminator });
  const nightTex   = new ImageTexture({ uniformName: 'uNightTex' });
  const encodedTex = new Gamma({ color: nightTex.output('Color'), gamma: 1.0 / 1.75 });
  const lights     = new Emission({ color: encodedTex.output('Color'), strength: nightBlend.output('Value') });
  const alpha      = new ShaderMath({ mode: 'MULTIPLY', a: nightBlend.output('Value'), b: 0.75 });

  const out = new RgbaOutput({ color: lights.output('BSDF'), alpha: alpha.output('Value') });
  out.compile();

  out.material!.transparent = true;
  out.material!.depthWrite  = false;
  // Thin shell above the surface sphere — below depth precision at far
  // camera distances, causing z-fighting speckle. Bias depth toward camera.
  out.material!.polygonOffset       = true;
  out.material!.polygonOffsetFactor = -2;
  out.material!.polygonOffsetUnits  = -2;
  out.material!.blending    = THREE.AdditiveBlending;
  out.material!.uniforms['uNightTex'] = { value: nightTexture };

  return out.material!;
}
