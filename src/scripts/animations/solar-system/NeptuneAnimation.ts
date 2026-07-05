// src/scripts/animations/NeptuneAnimation.ts

import * as THREE from 'three';
import { AnimationMixer, AnimationClip, KeyframeTrack, easeInOutSine } from '@triforge/keyframe';
import { Neptune } from '../../objects/solar-system/neptune/Neptune';

export class NeptuneAnimation {

  private _mixer: AnimationMixer | null = null;
  private _worldPos = new THREE.Vector3();

  constructor(private neptune: Neptune) {}

  update(delta: number): void {
    if (!this.neptune.mesh || !this.neptune.pivot) return;

    if (!this._mixer) {
      this._mixer = this._init();
      if (!this._mixer) return;
    }

    this._mixer.update(delta);
    this._updateSunDirection();
  }

  private _updateSunDirection(): void {
    const material = this.neptune.mesh.material as THREE.ShaderMaterial;
    if (!material.uniforms || !material.uniforms['uSunDirection']) return;

    this.neptune.mesh.getWorldPosition(this._worldPos);
    (material.uniforms['uSunDirection'].value as THREE.Vector3)
      .copy(this._worldPos).multiplyScalar(-1).normalize();
  }

  private _init(): AnimationMixer | null {
    const { mesh, pivot, surfacePan, cloudPan } = this.neptune;
    if (!mesh || !pivot) return null;

    const mixer = new AnimationMixer();

    const pivotRot = pivot.rotation as unknown as Record<string, number>;
    mixer.play(new AnimationClip('orbit', [
      new KeyframeTrack(pivotRot, 'y', [{ time: 0, value: 0 }, { time: 83100, value: Math.PI * 2 }]),
    ]), { wrapMode: 'loop' });

    const meshRot = mesh.rotation as unknown as Record<string, number>;
    mixer.play(new AnimationClip('self-rot', [
      new KeyframeTrack(meshRot, 'y', [{ time: 0, value: 0 }, { time: 82, value: Math.PI * 2 }]),
    ]), { wrapMode: 'loop' });

    if (surfacePan) {
      mixer.play(new AnimationClip('tex-pan', [
        new KeyframeTrack(surfacePan, 'x', [{ time: 0, value: 0 }, { time: 160, value: 1 }]),
        new KeyframeTrack(surfacePan, 'y', [{ time: 0, value: 0 }, { time: 160, value: 0.2 }]),
      ]), { wrapMode: 'loop' });
    }

    if (cloudPan) {
      mixer.play(new AnimationClip('cloud-pan', [
        new KeyframeTrack(cloudPan, 'x', [{ time: 0, value: 0 }, { time: 60, value: -1 }]),
      ]), { wrapMode: 'loop' });
    }

    const glow = mesh.getObjectByName('ex-neptune-glow-js') as THREE.Sprite | undefined;
    if (glow) {
      const glowScale = glow.scale as unknown as Record<string, number>;
      mixer.play(new AnimationClip('glow', [
        new KeyframeTrack(glowScale, 'x', [{ time: 0, value: 1.76, easing: easeInOutSine }, { time: 4, value: 1.9 }]),
        new KeyframeTrack(glowScale, 'y', [{ time: 0, value: 1.76, easing: easeInOutSine }, { time: 4, value: 1.9 }]),
      ]), { wrapMode: 'pingpong' });
    }

    return mixer;
  }
}
