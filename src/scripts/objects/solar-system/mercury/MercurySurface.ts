// src/scripts/objects/solar-system/mercury/MercurySurface.ts

import * as THREE from 'three';
import { ImageTexture, PrincipledBSDF, Emission, AddShader, VectorMath, Gamma, MaterialOutput } from '@triforge/shader-core';
import { TextureBump, buildTerminatorNodes, buildBumpFadeStrength } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Mercury surface — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.15, 0.15, dot(vWorldNormal, sunDir))
 *   rgb        = lit(mercuryTex) * terminator
 *
 * PrincipledBSDF supplies the sun lighting via its uSunDirection uniform —
 * MercuryAnimation must update it each frame to normalize(-mercuryWorldPos)
 * (sun at scene origin). The warm emissive (0xfff5eb × 0.025) of the original
 * material is added as an Emission node. The Gamma node approximates the
 * tone-mapping + sRGB output conversion of the standard material pipeline.
 */
export function buildMercurySurfaceMaterial(mercuryTexture: THREE.Texture): THREE.ShaderMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.15, fromMax: 0.15 });

  const surfaceTex = new ImageTexture({ uniformName: 'uMercuryTex' });

  // Crater relief — texture luminance as a height map (dark ≈ deep holds for
  // Mercury). Two chained octaves: coarse crater basins + fine regolith grain.
  // Fine detail fades out earlier — it is sub-pixel long before the basins are.
  const coarseStrength = buildBumpFadeStrength({ strength: 0.15, fadeStart: 5, fadeEnd: 15 });
  const coarse = new TextureBump({ uniformName: 'uMercuryBumpTex', strength: coarseStrength, distance: 0.015, texelSize: 1.0 / 128.0, lod: 4.0 });

  const fineStrength = buildBumpFadeStrength({ strength: 0.05, fadeStart: 1, fadeEnd: 5 });
  const bump = new TextureBump({ uniformName: 'uMercuryBumpTex2', strength: fineStrength, distance: 0.015, texelSize: 1.0 / 512.0, lod: 1.0, normal: coarse.output('Normal') });

  const surface  = new PrincipledBSDF({
    baseColor: surfaceTex.output('Color'),
    roughness: 0.75,
    metallic: 0.25,
    normal: bump.output('Normal'),
  });
  const emissive = new Emission({ color: '#fff5eb', strength: 0.025 });
  const lit      = new AddShader({ shader1: surface.output('BSDF'), shader2: emissive.output('BSDF') });

  const shadowed = new VectorMath({ mode: 'SCALE', vector: lit.output('BSDF'), scale: terminator });
  const encoded  = new Gamma({ color: shadowed.output('Vector'), gamma: 1.0 / 1.75 });

  const out = new MaterialOutput({ surface: encoded.output('Color') });
  out.compile();

  out.material!.uniforms['uMercuryTex']      = { value: mercuryTexture };
  out.material!.uniforms['uMercuryBumpTex']  = { value: mercuryTexture };
  out.material!.uniforms['uMercuryBumpTex2'] = { value: mercuryTexture };

  return out.material!;
}
