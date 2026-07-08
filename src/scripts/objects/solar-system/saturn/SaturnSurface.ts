// src/scripts/objects/solar-system/saturn/SaturnSurface.ts

import * as THREE from 'three';
import { ImageTexture, PrincipledBSDF, Emission, AddShader, VectorMath, Gamma, MaterialOutput } from '@triforge/shader-core';
import { buildUvPan, buildTerminatorNodes, buildNightAmbient } from '../../../shader-nodes/CoreShaderNodes';
import type { PannableMaterial } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Saturn surface â€” triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = lit(saturnTex) * terminator + vec3(0.04, 0.03, 0.01) * (1.0 - terminator)
 *
 * PrincipledBSDF supplies the sun lighting via its uSunDirection uniform â€”
 * SaturnAnimation must update it each frame to normalize(-saturnWorldPos)
 * (sun at scene origin). The band emissive (0xc8b080 Ã— 0.025) of the original
 * material is added as an Emission node. The Gamma node approximates the
 * tone-mapping + sRGB output conversion of the standard material pipeline.
 *
 * No Bump node â€” gas giant, no solid terrain relief to fake.
 * Texture panning goes through a UvPan node (returned as `pan`) because
 * ShaderMaterials ignore THREE.Texture.offset.
 */
export function buildSaturnSurfaceMaterial(saturnTexture: THREE.Texture): PannableMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const uvPan      = buildUvPan();
  const surfaceTex = new ImageTexture({ uniformName: 'uSaturnTex', vector: uvPan.vector });

  const surface  = new PrincipledBSDF({
    baseColor: surfaceTex.output('Color'),
    roughness: 0.8,
    metallic: 0.0,
  });
  const emissive = new Emission({ color: '#c8b080', strength: 0.025 });
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

  out.material!.uniforms['uSaturnTex'] = { value: saturnTexture };

  return { material: out.material!, pan: uvPan.pan };
}
