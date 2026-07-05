// src/scripts/animations/VenusAnimation.ts

import * as THREE from 'three';
import { AnimationMixer, AnimationClip, KeyframeTrack, easeInOutSine } from '@triforge/keyframe';
import { Venus } from '../../objects/solar-system/venus/Venus';

export class VenusAnimation {

  private _mixer: AnimationMixer | null = null;
  private _worldPos = new THREE.Vector3();

  constructor(private venus: Venus) {}

  update(delta: number): void {
    if (!this.venus.mesh || !this.venus.pivot) return;

    if (!this._mixer) {
      this._mixer = this._init();
      if (!this._mixer) return;
    }

    this._mixer.update(delta);
    this._updateSunDirection();
  }

  private _updateSunDirection(): void {
    const material = this.venus.mesh.material as THREE.ShaderMaterial;
    if (!material.uniforms || !material.uniforms['uSunDirection']) return;

    this.venus.mesh.getWorldPosition(this._worldPos);
    (material.uniforms['uSunDirection'].value as THREE.Vector3)
      .copy(this._worldPos).multiplyScalar(-1).normalize();
  }

  private _init(): AnimationMixer | null {
    const { mesh, pivot, cloud } = this.venus;
    if (!mesh || !pivot) return null;

    const mixer = new AnimationMixer();

    const pivotRot = pivot.rotation as unknown as Record<string, number>;
    mixer.play(new AnimationClip('orbit', [
      new KeyframeTrack(pivotRot, 'y', [{ time: 0, value: 0 }, { time: 750, value: Math.PI * 2 }]),
    ]), { wrapMode: 'loop' });

    const meshRot = mesh.rotation as unknown as Record<string, number>;
    mixer.play(new AnimationClip('self-rot', [
      new KeyframeTrack(meshRot, 'y', [{ time: 0, value: 0 }, { time: 500, value: Math.PI * 2 }]),
    ]), { wrapMode: 'loop' });

    if (cloud) {
      const cloudRot = cloud.rotation as unknown as Record<string, number>;
      mixer.play(new AnimationClip('cloud-rot', [
        new KeyframeTrack(cloudRot, 'y', [{ time: 0, value: 0 }, { time: 350, value: Math.PI * 2 }]),
      ]), { wrapMode: 'loop' });
    }

    const glow = mesh.getObjectByName('ex-venus-glow-js') as THREE.Sprite | undefined;
    if (glow) {
      const glowScale = glow.scale as unknown as Record<string, number>;
      mixer.play(new AnimationClip('glow', [
        new KeyframeTrack(glowScale, 'x', [{ time: 0, value: 1.8, easing: easeInOutSine }, { time: 3, value: 1.95 }]),
        new KeyframeTrack(glowScale, 'y', [{ time: 0, value: 1.8, easing: easeInOutSine }, { time: 3, value: 1.95 }]),
      ]), { wrapMode: 'pingpong' });
    }

    return mixer;
  }
}
