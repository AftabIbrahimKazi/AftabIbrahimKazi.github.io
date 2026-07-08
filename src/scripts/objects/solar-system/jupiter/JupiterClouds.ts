// src/scripts/objects/solar-system/jupiter/JupiterClouds.ts

import * as THREE from 'three';
import { ImageTexture, Gamma, Emission, TransparentBSDF, MixShader, MaterialOutput } from '@triforge/shader-core';
import { buildUvPan, buildTerminatorNodes } from '../../../shader-nodes/CoreShaderNodes';
import type { PannableMaterial } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Jupiter cloud layer — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = cloudTex * terminator
 *   alpha      = 0.4                       // constant opacity, additive blending
 *
 * Same 8k_jupiter texture as the surface, panned independently (UvPan) to
 * create band drift. The Gamma node re-encodes the linear texture sample to
 * approximate the sRGB output conversion of the standard material pipeline.
 */
export function buildJupiterCloudMaterial(cloudTexture: THREE.Texture): PannableMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const uvPan      = buildUvPan();
  const cloudTex   = new ImageTexture({ uniformName: 'uCloudTex', vector: uvPan.vector });
  const encodedTex = new Gamma({ color: cloudTex.output('Color'), gamma: 1.0 / 1.75 });

  const clouds = new Emission({ color: encodedTex.output('Color'), strength: terminator });

  const blended = new MixShader({ fac: 0.4, shader1: new TransparentBSDF().output('BSDF'), shader2: clouds.output('BSDF') });
  const out = new MaterialOutput({ surface: blended.output('BSDF') });
  out.compile();

  out.material!.depthWrite  = false;
  out.material!.blending    = THREE.AdditiveBlending;
  // The cloud shell sits 0.0015 above a 1.5-radius surface — below depth
  // precision at far camera distances (near 0.1 / far 1000), causing
  // z-fighting speckle. Bias cloud depth toward the camera instead.
  out.material!.polygonOffset       = true;
  out.material!.polygonOffsetFactor = -2;
  out.material!.polygonOffsetUnits  = -2;
  out.material!.uniforms['uCloudTex'] = { value: cloudTexture };

  return { material: out.material!, pan: uvPan.pan };
}
