// src/scripts/objects/solar-system/mercury/MercuryAtmosphere.ts

import * as THREE from 'three';
import { VectorMath, ShaderMath, Emission, TransparentBSDF, MixShader, MaterialOutput } from '@triforge/shader-core';
import { buildTerminatorNodes } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Mercury atmosphere — triforge node-graph port of the original onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(0.0, 0.15, dot(vWorldNormal, sunDir))
 *   fresnel    = pow(1.0 - dot(N, V), 6.0)
 *   rgb        = vec3(0.8, 0.9, 1.0) * fresnel * terminator
 *   alpha      = fresnel * terminator * 1.5
 *
 * fromMin is 0.0 (original GLSL used -0.15) so the rim glow stops at the
 * terminator instead of bleeding onto the night side — same fix as Earth.
 */
export function buildMercuryAtmosphereMaterial(): THREE.ShaderMaterial {
  const { geometry, terminator } = buildTerminatorNodes({ fromMin: 0.0, fromMax: 0.15 });

  const toCamera  = new VectorMath({ mode: 'SCALE', vector: geometry.output('Incoming'), scale: -1 });
  const viewAngle = new VectorMath({ mode: 'DOT_PRODUCT', vector: geometry.output('Normal'), vectorB: toCamera.output('Vector') });
  const grazing   = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: viewAngle.output('Value') });
  const fresnel   = new ShaderMath({ mode: 'POWER', a: grazing.output('Value'), b: 6.0 });

  const intensity = new ShaderMath({ mode: 'MULTIPLY', a: fresnel.output('Value'), b: terminator });
  const glow      = new Emission({ color: [0.8, 0.9, 1.0] as unknown as string, strength: intensity.output('Value') });
  const alpha     = new ShaderMath({ mode: 'MULTIPLY', a: intensity.output('Value'), b: 1.5 });

  const blended = new MixShader({ fac: alpha.output('Value'), shader1: new TransparentBSDF().output('BSDF'), shader2: glow.output('BSDF') });
  const out = new MaterialOutput({ surface: blended.output('BSDF') });
  out.compile();

  out.material!.depthWrite  = false;

  return out.material!;
}
