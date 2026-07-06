// src/scripts/objects/solar-system/venus/VenusSurface.ts

import * as THREE from 'three';
import { ImageTexture, PrincipledBSDF, Emission, AddShader, VectorMath, Gamma, MaterialOutput } from '@triforge/shader-core';
import { TextureBump, buildTerminatorNodes, buildBumpFadeStrength, buildNightAmbient } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Venus surface — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = lit(venusTex) * terminator
 *
 * PrincipledBSDF supplies the sun lighting via its uSunDirection uniform —
 * VenusAnimation must update it each frame to normalize(-venusWorldPos)
 * (sun at scene origin). The warm emissive (0xfff5eb × 0.025) of the original
 * material is added as an Emission node. The Gamma node approximates the
 * tone-mapping + sRGB output conversion of the standard material pipeline.
 */
export function buildVenusSurfaceMaterial(venusTexture: THREE.Texture): THREE.ShaderMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const surfaceTex = new ImageTexture({ uniformName: 'uVenusTex' });

  // Terrain relief — texture luminance as a height map.
  const bumpStrength = buildBumpFadeStrength({ strength: 0.15, fadeStart: 5, fadeEnd: 14 });
  const bump   = new TextureBump({ uniformName: 'uVenusBumpTex', strength: bumpStrength, distance: 0.015, texelSize: 1.0 / 512.0, lod: 0.0 });

  const surface  = new PrincipledBSDF({
    baseColor: surfaceTex.output('Color'),
    roughness: 0.75,
    metallic: 0.25,
    normal: bump.output('Normal'),
  });
  const emissive = new Emission({ color: '#fff5eb', strength: 0.025 });
  const lit      = new AddShader({ shader1: surface.output('BSDF'), shader2: emissive.output('BSDF') });

  const shadowed     = new VectorMath({ mode: 'SCALE', vector: lit.output('BSDF'), scale: terminator });
  const nightAmbient = buildNightAmbient({ color: surfaceTex.output('Color'), terminator });
  const filled       = new AddShader({ shader1: shadowed.output('Vector'), shader2: nightAmbient });
  const encoded      = new Gamma({ color: filled.output('BSDF'), gamma: 1.0 / 1.75 });

  const toShader = new Emission({ color: encoded.output('Color'), strength: 1.0 });
  const out = new MaterialOutput({ surface: toShader.output('BSDF') });
  out.compile();

  // Neutralise the library's default in-BSDF ambient (0.3.0+) — the day side was
  // tuned without it, and the terminator multiply zeroes it at night anyway;
  // night fill comes from buildNightAmbient instead.
  (out.material!.uniforms['uAmbientColor']!.value as THREE.Vector3).set(0, 0, 0);

  out.material!.uniforms['uVenusTex'] = { value: venusTexture };
  out.material!.uniforms['uVenusBumpTex'] = { value: venusTexture };

  return out.material!;
}
