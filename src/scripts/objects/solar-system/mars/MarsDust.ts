// src/scripts/objects/solar-system/mars/MarsDust.ts

import * as THREE from 'three';
import { ImageTexture, VectorMath, ShaderMath, Gamma, Emission, SeparateRGB } from '@triforge/shader-core';
import { RgbaOutput, buildTerminatorNodes } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Mars dust layer — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = dustTex * vec3(1.0, 0.831, 0.627) * terminator   // 0xffd4a0 tint
 *   alpha      = 0.25 * dustTex.g                                 // opacity × alphaMap green
 *
 * The Gamma node re-encodes the linear texture sample to approximate the
 * sRGB output conversion the standard material pipeline performed.
 */
export function buildMarsDustMaterial(dustTexture: THREE.Texture): THREE.ShaderMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const dustTex    = new ImageTexture({ uniformName: 'uDustTex' });
  const encodedTex = new Gamma({ color: dustTex.output('Color'), gamma: 1.0 / 1.75 });
  const tinted     = new VectorMath({ mode: 'MULTIPLY', vector: encodedTex.output('Color'), vectorB: [1.0, 0.831, 0.627] });

  const dust = new Emission({ color: tinted.output('Vector'), strength: terminator });

  const alphaMap = new SeparateRGB({ color: dustTex.output('Color') });
  const alpha    = new ShaderMath({ mode: 'MULTIPLY', a: alphaMap.output('G'), b: 0.25 });

  const out = new RgbaOutput({ color: dust.output('BSDF'), alpha: alpha.output('Value') });
  out.compile();

  out.material!.transparent = true;
  out.material!.depthWrite  = false;
  // Thin shell above the surface sphere — below depth precision at far
  // camera distances, causing z-fighting speckle. Bias depth toward camera.
  out.material!.polygonOffset       = true;
  out.material!.polygonOffsetFactor = -2;
  out.material!.polygonOffsetUnits  = -2;
  out.material!.uniforms['uDustTex'] = { value: dustTexture };

  return out.material!;
}
