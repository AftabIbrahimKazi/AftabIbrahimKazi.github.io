// src/scripts/objects/solar-system/earth/EarthAtmosphere.ts

import * as THREE from 'three';
import { VectorMath, ShaderMath, Emission } from '@triforge/shader-core';
import { RgbaOutput, buildTerminatorNodes } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Earth atmosphere — triforge node-graph port of the original onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(0.0, 0.4, dot(vWorldNormal, sunDir))
 *   fresnel    = pow(1.0 - dot(N, V), 6.0)
 *   rgb        = vec3(0.4, 0.8, 0.9) * fresnel * terminator
 *   alpha      = fresnel * terminator * 1.5
 */
export function buildEarthAtmosphereMaterial(): THREE.ShaderMaterial {
  const { geometry, terminator } = buildTerminatorNodes({ fromMin: 0.0, fromMax: 0.4 });

  const toCamera  = new VectorMath({ mode: 'SCALE', vector: geometry.output('Incoming'), scale: -1 });
  const viewAngle = new VectorMath({ mode: 'DOT_PRODUCT', vector: geometry.output('Normal'), vectorB: toCamera.output('Vector') });
  const grazing   = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: viewAngle.output('Value') });
  const fresnel   = new ShaderMath({ mode: 'POWER', a: grazing.output('Value'), b: 6.0 });

  const intensity = new ShaderMath({ mode: 'MULTIPLY', a: fresnel.output('Value'), b: terminator });
  const glow      = new Emission({ color: [0.4, 0.8, 0.9] as unknown as string, strength: intensity.output('Value') });
  const alpha     = new ShaderMath({ mode: 'MULTIPLY', a: intensity.output('Value'), b: 1.5 });

  const out = new RgbaOutput({ color: glow.output('BSDF'), alpha: alpha.output('Value') });
  out.compile();

  out.material!.transparent = true;
  out.material!.depthWrite  = false;

  return out.material!;
}
