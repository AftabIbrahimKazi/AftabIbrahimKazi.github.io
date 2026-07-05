// src/scripts/objects/solar-system/earth/EarthSurface.ts

import * as THREE from 'three';
import { ImageTexture, PrincipledBSDF, Emission, AddShader, VectorMath, SeparateRGB, Gamma, MaterialOutput } from '@triforge/shader-core';
import { TextureBump, buildTerminatorNodes, buildBumpFadeStrength } from '../../../shader-nodes/CoreShaderNodes';

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
 * Not ported: the tangent-space normal map (normalScale 0.75) — triforge's
 * NormalMap node is a procedural height-gradient node and cannot consume a
 * tangent-space normal texture. A Bump node driven by day-map luminance
 * stands in for it. Flagged in handover.md.
 */
export function buildEarthSurfaceMaterial(dayTexture: THREE.Texture, specularTexture: THREE.Texture): THREE.ShaderMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const dayTex    = new ImageTexture({ uniformName: 'uDayTex' });
  const roughness = new SeparateRGB({ color: new ImageTexture({ uniformName: 'uRoughTex' }).output('Color') });

  // Terrain relief — day-map luminance as a height map (approximation: ocean
  // vs land brightness, not true elevation data).
  const bumpStrength = buildBumpFadeStrength({ strength: 0.15, fadeStart: 5, fadeEnd: 14 });
  const bump   = new TextureBump({ uniformName: 'uEarthBumpTex', strength: bumpStrength, distance: 0.015, texelSize: 1.0 / 512.0, lod: 0.0 });

  const surface  = new PrincipledBSDF({
    baseColor: dayTex.output('Color'),
    roughness: roughness.output('G'),
    metallic: 0.0,
    normal: bump.output('Normal'),
  });
  const emissive = new Emission({ color: [1, 1, 1] as unknown as string, strength: 0.0275 });
  const lit      = new AddShader({ shader1: surface.output('BSDF'), shader2: emissive.output('BSDF') });

  const shadowed = new VectorMath({ mode: 'SCALE', vector: lit.output('BSDF'), scale: terminator });
  const encoded  = new Gamma({ color: shadowed.output('Vector'), gamma: 1.0 / 1.75 });

  const out = new MaterialOutput({ surface: encoded.output('Color') });
  out.compile();

  out.material!.uniforms['uDayTex']   = { value: dayTexture };
  out.material!.uniforms['uEarthBumpTex'] = { value: dayTexture };
  out.material!.uniforms['uRoughTex'] = { value: specularTexture };

  return out.material!;
}
