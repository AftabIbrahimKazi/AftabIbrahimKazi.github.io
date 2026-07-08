// src/scripts/objects/solar-system/neptune/NeptuneClouds.ts

import * as THREE from 'three';
import { ImageTexture, Gamma, Emission, TransparentBSDF, MixShader, MaterialOutput } from '@triforge/shader-core';
import { buildUvPan, buildTerminatorNodes } from '../../../shader-nodes/CoreShaderNodes';
import type { PannableMaterial } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Neptune cloud layer — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = cloudTex * terminator
 *   alpha      = 0.35                      // constant opacity, additive blending
 *
 * Same 2k_neptune texture as the surface, panned independently (UvPan) to
 * create band drift. The Gamma node re-encodes the linear texture sample to
 * approximate the sRGB output conversion of the standard material pipeline.
 */
export function buildNeptuneCloudMaterial(cloudTexture: THREE.Texture): PannableMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const uvPan      = buildUvPan();
  const cloudTex   = new ImageTexture({ uniformName: 'uCloudTex', vector: uvPan.vector });
  const encodedTex = new Gamma({ color: cloudTex.output('Color'), gamma: 1.0 / 1.75 });

  const clouds = new Emission({ color: encodedTex.output('Color'), strength: terminator });

  const blended = new MixShader({ fac: 0.35, shader1: new TransparentBSDF().output('BSDF'), shader2: clouds.output('BSDF') });
  const out = new MaterialOutput({ surface: blended.output('BSDF') });
  out.compile();

  out.material!.depthWrite  = false;
  // Thin shell above the surface sphere — below depth precision at far
  // camera distances, causing z-fighting speckle. Bias depth toward camera.
  out.material!.polygonOffset       = true;
  out.material!.polygonOffsetFactor = -2;
  out.material!.polygonOffsetUnits  = -2;
  out.material!.blending    = THREE.AdditiveBlending;
  out.material!.uniforms['uCloudTex'] = { value: cloudTexture };

  return { material: out.material!, pan: uvPan.pan };
}
