// src/scripts/objects/solar-system/jupiter/JupiterSurface.ts

import * as THREE from 'three';
import { ImageTexture, PrincipledBSDF, Emission, AddShader, VectorMath, ShaderMath, Gamma, MaterialOutput } from '@triforge/shader-core';
import { UvPan, buildTerminatorNodes } from '../../../shader-nodes/CoreShaderNodes';
import type { PannableMaterial } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Jupiter surface — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = lit(jupiterTex) * terminator + vec3(0.05, 0.03, 0.02) * (1.0 - terminator)
 *
 * PrincipledBSDF supplies the sun lighting via its uSunDirection uniform —
 * JupiterAnimation must update it each frame to normalize(-jupiterWorldPos)
 * (sun at scene origin). The band emissive (0xc8a882 × 0.025) of the original
 * material is added as an Emission node. The Gamma node approximates the
 * tone-mapping + sRGB output conversion of the standard material pipeline.
 *
 * No Bump node — gas giant, no solid terrain relief to fake.
 * Texture panning goes through a UvPan node (returned as `pan`) because
 * ShaderMaterials ignore THREE.Texture.offset.
 */
export function buildJupiterSurfaceMaterial(jupiterTexture: THREE.Texture): PannableMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const uvPan      = new UvPan();
  const surfaceTex = new ImageTexture({ uniformName: 'uJupiterTex', vector: uvPan.output('UV') });

  const surface  = new PrincipledBSDF({
    baseColor: surfaceTex.output('Color'),
    roughness: 0.8,
    metallic: 0.0,
  });
  const emissive = new Emission({ color: '#c8a882', strength: 0.025 });
  const lit      = new AddShader({ shader1: surface.output('BSDF'), shader2: emissive.output('BSDF') });

  const shadowed   = new VectorMath({ mode: 'SCALE', vector: lit.output('BSDF'), scale: terminator });
  const nightBlend = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: terminator });
  const nightTint  = new Emission({ color: [0.05, 0.03, 0.02] as unknown as string, strength: nightBlend.output('Value') });
  const combined   = new AddShader({ shader1: shadowed.output('Vector'), shader2: nightTint.output('BSDF') });

  const encoded = new Gamma({ color: combined.output('BSDF'), gamma: 1.0 / 1.75 });

  const out = new MaterialOutput({ surface: encoded.output('Color') });
  out.compile();

  out.material!.uniforms['uJupiterTex'] = { value: jupiterTexture };

  return { material: out.material!, pan: uvPan.parameters as Record<string, number> };
}
