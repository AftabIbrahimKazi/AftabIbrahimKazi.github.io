// src/scripts/objects/solar-system/venus/VenusClouds.ts

import * as THREE from 'three';
import { ImageTexture, VectorMath, Gamma, Emission } from '@triforge/shader-core';
import { RgbaOutput, buildTerminatorNodes } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Venus cloud layer — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = cloudTex * vec3(1.0, 0.91, 0.627) * terminator   // 0xffe8a0 tint
 *   alpha      = 0.75                                             // constant opacity
 *
 * The Gamma node re-encodes the linear texture sample to approximate the
 * sRGB output conversion the standard material pipeline performed.
 */
export function buildVenusCloudMaterial(cloudTexture: THREE.Texture): THREE.ShaderMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const cloudTex   = new ImageTexture({ uniformName: 'uCloudTex' });
  const encodedTex = new Gamma({ color: cloudTex.output('Color'), gamma: 1.0 / 1.75 });
  const tinted     = new VectorMath({ mode: 'MULTIPLY', vector: encodedTex.output('Color'), vectorB: [1.0, 0.91, 0.627] });

  const clouds = new Emission({ color: tinted.output('Vector'), strength: terminator });

  const out = new RgbaOutput({ color: clouds.output('BSDF'), alpha: 0.75 });
  out.compile();

  out.material!.transparent = true;
  out.material!.depthWrite  = false;
  // Thin shell above the surface sphere — below depth precision at far
  // camera distances, causing z-fighting speckle. Bias depth toward camera.
  out.material!.polygonOffset       = true;
  out.material!.polygonOffsetFactor = -2;
  out.material!.polygonOffsetUnits  = -2;
  out.material!.uniforms['uCloudTex'] = { value: cloudTexture };

  return out.material!;
}
