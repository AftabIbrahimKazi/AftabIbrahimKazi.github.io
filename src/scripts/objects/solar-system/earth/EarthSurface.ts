// src/scripts/objects/solar-system/earth/EarthSurface.ts

import * as THREE from 'three';
import { ImageTexture, PrincipledBSDF, Emission, AddShader, VectorMath, SeparateRGB, NormalMap, Gamma, MaterialOutput } from '@triforge/shader-core';
import { buildTerminatorNodes, buildNightAmbient } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Earth surface — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = lit(dayTex) * terminator
 *
 * PrincipledBSDF supplies the sun lighting via its uSunDirection uniform —
 * EarthAnimation must update it each frame to normalize(-earthWorldPos)
 * (sun at scene origin). The flat white emissive (0.0275) of the original
 * material is added as an Emission node. The Gamma node approximates the
 * tone-mapping + sRGB output conversion of the standard material pipeline.
 *
 * Terrain relief: the original tangent-space normal map (normalScale 0.75),
 * restored via shader-core 0.3.0's rewritten NormalMap node (tangent-space
 * decode with a derivative cotangent frame). Replaces the interim TextureBump
 * stand-in that derived relief from day-map luminance.
 */
export function buildEarthSurfaceMaterial(dayTexture: THREE.Texture, specularTexture: THREE.Texture, normalTexture: THREE.Texture): THREE.ShaderMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const dayTex    = new ImageTexture({ uniformName: 'uDayTex' });
  const roughness = new SeparateRGB({ color: new ImageTexture({ uniformName: 'uRoughTex' }).output('Color') });

  const normalTex = new ImageTexture({ uniformName: 'uNormalTex' });
  const normal    = new NormalMap({ color: normalTex.output('Color'), strength: 0.75 });

  const surface  = new PrincipledBSDF({
    baseColor: dayTex.output('Color'),
    roughness: roughness.output('G'),
    metallic: 0.0,
    normal: normal.output('Normal'),
  });
  const emissive = new Emission({ color: [1, 1, 1] as unknown as string, strength: 0.0275 });
  const lit      = new AddShader({ shader1: surface.output('BSDF'), shader2: emissive.output('BSDF') });

  const shadowed     = new VectorMath({ mode: 'SCALE', vector: lit.output('BSDF'), scale: terminator });
  const nightAmbient = buildNightAmbient({ color: dayTex.output('Color'), terminator });
  const filled       = new AddShader({ shader1: shadowed.output('Vector'), shader2: nightAmbient });
  const encoded      = new Gamma({ color: filled.output('BSDF'), gamma: 1.0 / 1.75 });

  const toShader = new Emission({ color: encoded.output('Color'), strength: 1.0 });
  const out = new MaterialOutput({ surface: toShader.output('BSDF') });
  out.compile();

  // Neutralise the library's default in-BSDF ambient (0.3.0+) — the day side was
  // tuned without it, and the terminator multiply zeroes it at night anyway;
  // night fill comes from buildNightAmbient instead.
  (out.material!.uniforms['uAmbientColor']!.value as THREE.Vector3).set(0, 0, 0);

  out.material!.uniforms['uDayTex']    = { value: dayTexture };
  out.material!.uniforms['uRoughTex']  = { value: specularTexture };
  out.material!.uniforms['uNormalTex'] = { value: normalTexture };

  return out.material!;
}
