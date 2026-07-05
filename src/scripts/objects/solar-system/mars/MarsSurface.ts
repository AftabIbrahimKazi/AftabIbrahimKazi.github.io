// src/scripts/objects/solar-system/mars/MarsSurface.ts

import * as THREE from 'three';
import { ImageTexture, PrincipledBSDF, Emission, AddShader, VectorMath, ShaderMath, Gamma, MaterialOutput } from '@triforge/shader-core';
import { TextureBump, buildTerminatorNodes, buildBumpFadeStrength } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Mars surface — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = lit(marsTex) * terminator + vec3(0.08, 0.02, 0.01) * (1.0 - terminator)
 *
 * PrincipledBSDF supplies the sun lighting via its uSunDirection uniform —
 * MarsAnimation must update it each frame to normalize(-marsWorldPos)
 * (sun at scene origin). The rust emissive (0xc1622a × 0.15) of the original
 * material is added as an Emission node. The Gamma node approximates the
 * tone-mapping + sRGB output conversion of the standard material pipeline.
 */
export function buildMarsSurfaceMaterial(marsTexture: THREE.Texture): THREE.ShaderMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const surfaceTex = new ImageTexture({ uniformName: 'uMarsTex' });

  // Terrain relief — texture luminance as a height map.
  const bumpStrength = buildBumpFadeStrength({ strength: 0.15, fadeStart: 5, fadeEnd: 14 });
  const bump   = new TextureBump({ uniformName: 'uMarsBumpTex', strength: bumpStrength, distance: 0.015, texelSize: 1.0 / 512.0, lod: 0.0 });

  const surface  = new PrincipledBSDF({
    baseColor: surfaceTex.output('Color'),
    roughness: 0.75,
    metallic: 0.25,
    normal: bump.output('Normal'),
  });
  const emissive = new Emission({ color: '#c1622a', strength: 0.15 });
  const lit      = new AddShader({ shader1: surface.output('BSDF'), shader2: emissive.output('BSDF') });

  const shadowed   = new VectorMath({ mode: 'SCALE', vector: lit.output('BSDF'), scale: terminator });
  const nightBlend = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: terminator });
  const nightTint  = new Emission({ color: [0.08, 0.02, 0.01] as unknown as string, strength: nightBlend.output('Value') });
  const combined   = new AddShader({ shader1: shadowed.output('Vector'), shader2: nightTint.output('BSDF') });

  const encoded = new Gamma({ color: combined.output('BSDF'), gamma: 1.0 / 1.75 });

  const out = new MaterialOutput({ surface: encoded.output('Color') });
  out.compile();

  out.material!.uniforms['uMarsTex'] = { value: marsTexture };
  out.material!.uniforms['uMarsBumpTex'] = { value: marsTexture };

  return out.material!;
}
