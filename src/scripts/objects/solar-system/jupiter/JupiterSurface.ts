// src/scripts/objects/solar-system/jupiter/JupiterSurface.ts

import * as THREE from 'three';
import { ImageTexture, PrincipledBSDF, Emission, AddShader, VectorMath, Gamma, MaterialOutput } from '@triforge/shader-core';
import { UvPan, buildTerminatorNodes, buildNightAmbient } from '../../../shader-nodes/CoreShaderNodes';
import type { PannableMaterial } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Jupiter surface â€” triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = lit(jupiterTex) * terminator + vec3(0.05, 0.03, 0.02) * (1.0 - terminator)
 *
 * PrincipledBSDF supplies the sun lighting via its uSunDirection uniform â€”
 * JupiterAnimation must update it each frame to normalize(-jupiterWorldPos)
 * (sun at scene origin). The band emissive (0xc8a882 Ã— 0.025) of the original
 * material is added as an Emission node. The Gamma node approximates the
 * tone-mapping + sRGB output conversion of the standard material pipeline.
 *
 * No Bump node â€” gas giant, no solid terrain relief to fake.
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

  const shadowed = new VectorMath({ mode: 'SCALE', vector: lit.output('BSDF'), scale: terminator });

  const nightAmbient = buildNightAmbient({ color: surfaceTex.output('Color'), terminator, strength: 0 });
  const filled       = new AddShader({ shader1: shadowed.output('Vector'), shader2: nightAmbient });

  const encoded = new Gamma({ color: filled.output('BSDF'), gamma: 1.0 / 1.75 });

  const toShader = new Emission({ color: encoded.output('Color'), strength: 1.0 });
  const out = new MaterialOutput({ surface: toShader.output('BSDF') });
  out.compile();

  // Neutralise the library's default in-BSDF ambient (0.3.0+) — the day side was
  // tuned without it, and the terminator multiply zeroes it at night anyway;
  // night fill comes from buildNightAmbient instead.
  (out.material!.uniforms['uAmbientColor']!.value as THREE.Vector3).set(0, 0, 0);

  out.material!.uniforms['uJupiterTex'] = { value: jupiterTexture };

  return { material: out.material!, pan: uvPan.parameters as Record<string, number> };
}
