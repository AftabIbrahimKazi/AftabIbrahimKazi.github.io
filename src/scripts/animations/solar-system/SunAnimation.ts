// src/scripts/animations/SunAnimation.ts

import * as THREE from 'three';
import { AnimationMixer, AnimationClip, KeyframeTrack, easeInOutSine } from '@triforge/keyframe';
import { Sun } from '../../objects/solar-system/sun/Sun';

export class SunAnimation {

  private _mixer: AnimationMixer | null = null;

  constructor(private sun: Sun) {}

  update(delta: number): void {
    if (!this.sun.mesh) return;

    if (!this._mixer) {
      this._mixer = this._init();
      if (!this._mixer) return;
    }

    this._mixer.update(delta);
  }

  private _init(): AnimationMixer | null {
    const { mesh, surfacePan, blur, halo, rays } = this.sun;
    if (!surfacePan || !blur || !halo || !rays) return null;

    const mixer = new AnimationMixer();

    // Self-rotation (loop)
    const meshRot = mesh.rotation as unknown as Record<string, number>;
    mixer.play(new AnimationClip('mesh-rot', [
      new KeyframeTrack(meshRot, 'y', [{ time: 0, value: 0 }, { time: 40, value: Math.PI * 2 }]),
    ]), { wrapMode: 'loop' });

    // Blur material rotation (loop)
    const blurMat = blur.material as unknown as Record<string, number>;
    mixer.play(new AnimationClip('blur-rot', [
      new KeyframeTrack(blurMat, 'rotation', [{ time: 0, value: 0 }, { time: 20, value: Math.PI * 2 }]),
    ]), { wrapMode: 'loop' });

    // Halo material rotation (loop, counter-clockwise)
    const haloMat = halo.material as unknown as Record<string, number>;
    mixer.play(new AnimationClip('halo-rot', [
      new KeyframeTrack(haloMat, 'rotation', [{ time: 0, value: 0 }, { time: 60, value: -Math.PI * 2 }]),
    ]), { wrapMode: 'loop' });

    // Blur scale pulse (pingpong)
    const blurScale = blur.scale as unknown as Record<string, number>;
    mixer.play(new AnimationClip('blur-scale', [
      new KeyframeTrack(blurScale, 'x', [{ time: 0, value: 5.6, easing: easeInOutSine }, { time: 2, value: 6.0 }]),
      new KeyframeTrack(blurScale, 'y', [{ time: 0, value: 5.6, easing: easeInOutSine }, { time: 2, value: 6.0 }]),
    ]), { wrapMode: 'pingpong' });

    // Halo scale pulse (pingpong)
    const haloScale = halo.scale as unknown as Record<string, number>;
    mixer.play(new AnimationClip('halo-scale', [
      new KeyframeTrack(haloScale, 'x', [{ time: 0, value: 13.5, easing: easeInOutSine }, { time: 4, value: 14.5 }]),
      new KeyframeTrack(haloScale, 'y', [{ time: 0, value: 13.5, easing: easeInOutSine }, { time: 4, value: 14.5 }]),
    ]), { wrapMode: 'pingpong' });

    // Rays scale pulse (pingpong)
    const raysScale = rays.scale as unknown as Record<string, number>;
    const raysMat  = rays.material as unknown as Record<string, number>;
    mixer.play(new AnimationClip('rays-scale', [
      new KeyframeTrack(raysScale, 'x', [{ time: 0, value: 23, easing: easeInOutSine }, { time: 5, value: 26 }]),
      new KeyframeTrack(raysScale, 'y', [{ time: 0, value: 5.5, easing: easeInOutSine }, { time: 5, value: 6.5 }]),
    ]), { wrapMode: 'pingpong' });

    // Rays opacity pulse (pingpong)
    mixer.play(new AnimationClip('rays-opacity', [
      new KeyframeTrack(raysMat, 'opacity', [{ time: 0, value: 0.15, easing: easeInOutSine }, { time: 3, value: 0.25 }]),
    ]), { wrapMode: 'pingpong' });

    // Texture pan (loop)
    mixer.play(new AnimationClip('tex-pan', [
      new KeyframeTrack(surfacePan, 'x', [{ time: 0, value: 0 }, { time: 120, value: 1 }]),
      new KeyframeTrack(surfacePan, 'y', [{ time: 0, value: 0 }, { time: 120, value: 1 }]),
    ]), { wrapMode: 'loop' });

    return mixer;
  }
}
