// src/scripts/objects/solar-system/uranus/UranusSurface.ts

import * as THREE from 'three';
import { ImageTexture, PrincipledBSDF, Emission, AddShader, VectorMath, ShaderMath, Gamma, MaterialOutput } from '@triforge/shader-core';
import { UvPan, buildTerminatorNodes } from '../../../shader-nodes/CoreShaderNodes';
import type { PannableMaterial } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Uranus surface — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = lit(uranusTex) * terminator + vec3(0.01, 0.03, 0.04) * (1.0 - terminator)
 *
 * PrincipledBSDF supplies the sun lighting via its uSunDirection uniform —
 * UranusAnimation must update it each frame to normalize(-uranusWorldPos)
 * (sun at scene origin). The cyan emissive (0x6dcfcf × 0.25) of the original
 * material is added as an Emission node. The Gamma node approximates the
 * tone-mapping + sRGB output conversion of the standard material pipeline.
 *
 * No Bump node — gas giant, no solid terrain relief to fake.
 * Texture panning goes through a UvPan node (returned as `pan`) because
 * ShaderMaterials ignore THREE.Texture.offset.
 */
export function buildUranusSurfaceMaterial(uranusTexture: THREE.Texture): PannableMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const uvPan      = new UvPan();
  const surfaceTex = new ImageTexture({ uniformName: 'uUranusTex', vector: uvPan.output('UV') });

  const surface  = new PrincipledBSDF({
    baseColor: surfaceTex.output('Color'),
    roughness: 0.8,
    metallic: 0.0,
  });
  const emissive = new Emission({ color: '#6dcfcf', strength: 0.25 });
  const lit      = new AddShader({ shader1: surface.output('BSDF'), shader2: emissive.output('BSDF') });

  const shadowed   = new VectorMath({ mode: 'SCALE', vector: lit.output('BSDF'), scale: terminator });
  const nightBlend = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: terminator });
  const nightTint  = new Emission({ color: [0.01, 0.03, 0.04] as unknown as string, strength: nightBlend.output('Value') });
  const combined   = new AddShader({ shader1: shadowed.output('Vector'), shader2: nightTint.output('BSDF') });

  const encoded = new Gamma({ color: combined.output('BSDF'), gamma: 1.0 / 1.75 });

  const out = new MaterialOutput({ surface: encoded.output('Color') });
  out.compile();

  out.material!.uniforms['uUranusTex'] = { value: uranusTexture };

  return { material: out.material!, pan: uvPan.parameters as Record<string, number> };
}
