// src/scripts/objects/solar-system/earth/EarthClouds.ts

import * as THREE from 'three';
import { ImageTexture, ShaderMath, Gamma, Emission, AddShader, SeparateRGB } from '@triforge/shader-core';
import { RgbaOutput, buildTerminatorNodes } from '../../../shader-nodes/CoreShaderNodes';

/**
 * Earth cloud layer — triforge node-graph port of the original
 * MeshStandardMaterial + onBeforeCompile GLSL:
 *
 *   terminator = smoothstep(-0.4, 0.4, dot(vWorldNormal, sunDir))
 *   rgb        = cloudTex * terminator + vec3(0.02, 0.03, 0.08) * (1.0 - terminator)
 *   alpha      = cloudTex.g              // alphaMap reads the green channel
 *
 * The Gamma node re-encodes the linear texture sample to approximate the
 * sRGB output conversion the standard material pipeline performed.
 */
export function buildEarthCloudMaterial(cloudTexture: THREE.Texture): THREE.ShaderMaterial {
  const { terminator } = buildTerminatorNodes({ fromMin: -0.4, fromMax: 0.4 });

  const nightBlend = new ShaderMath({ mode: 'SUBTRACT', a: 1.0, b: terminator });
  const cloudTex   = new ImageTexture({ uniformName: 'uCloudTex' });
  const encodedTex = new Gamma({ color: cloudTex.output('Color'), gamma: 1.0 / 1.75 });

  const dayClouds = new Emission({ color: encodedTex.output('Color'), strength: terminator });
  const nightTint = new Emission({ color: [0.02, 0.03, 0.08] as unknown as string, strength: nightBlend.output('Value') });
  const combined  = new AddShader({ shader1: dayClouds.output('BSDF'), shader2: nightTint.output('BSDF') });

  const alpha = new SeparateRGB({ color: cloudTex.output('Color') });

  const out = new RgbaOutput({ color: combined.output('BSDF'), alpha: alpha.output('G') });
  out.compile();

  out.material!.transparent = true;
  out.material!.depthWrite  = false;
  // Thin shell above the surface sphere — below depth precision at far
  // camera distances, causing z-fighting speckle. Bias depth toward camera.
  out.material!.polygonOffset       = true;
  out.material!.polygonOffsetFactor = -4;
  out.material!.polygonOffsetUnits  = -4;
  out.material!.uniforms['uCloudTex'] = { value: cloudTexture };

  return out.material!;
}
