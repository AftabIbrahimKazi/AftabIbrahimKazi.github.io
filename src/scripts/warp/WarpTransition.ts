// src/scripts/warp/WarpTransition.ts
// Warp speed transition — forward on CTA click, reverse on /sol entry.
// Uses @triforge/keyframe for the animation timeline and a triforge
// node-graph material (WarpShaderNodes.ts) for the star-field shader.

import * as THREE from 'three';
import { buildClip, AnimationMixer, easeInExpo, easeOutExpo, easeInOutQuad } from '@triforge/keyframe';
import { buildWarpMaterial } from './WarpShaderNodes';

export class WarpTransition {

  private _mat:      THREE.ShaderMaterial;
  private _params:   Record<string, number | [number, number, number]>;
  private _mesh:     THREE.Mesh;
  private _mixer:    AnimationMixer;
  private _scene:    THREE.Scene;
  private _renderer: THREE.WebGLRenderer;
  private _camera:   THREE.Camera;
  private _active    = false;
  private _elapsed   = 0;

  private _u = { speed: 0, opacity: 0, fade: 1 };

  private _onBlackCheck: (() => void) | null = null;
  private _onDoneCheck:  (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    this._renderer = renderer;

    this._scene  = new THREE.Scene();
    this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const warp   = buildWarpMaterial(window.innerWidth / window.innerHeight);
    this._mat    = warp.material;
    this._params = warp.parameters;

    // The triforge vertex shader projects through the camera matrices, so the
    // fullscreen quad sits inside the ortho frustum instead of bypassing it.
    this._mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this._mat);
    this._mesh.position.z    = -0.5;
    this._mesh.frustumCulled = false;
    this._scene.add(this._mesh);

    this._mixer = new AnimationMixer();

    window.addEventListener('resize', () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      this._params.aspect = window.innerWidth / window.innerHeight;
    });
  }

  playForward(onBlack: () => void): void {
    this._mixer.stopAll();
    this._u.speed   = 0;
    this._u.opacity = 0;
    this._u.fade    = 1;
    this._elapsed   = 0;
    this._active    = true;
    let blackFired  = false;

    const clip = buildClip('warp-forward', [
      { time: 0.00, targets: [[this._u, { speed: 0.0, opacity: 0.0, fade: 1.0 }]] },
      { time: 0.42, targets: [[this._u, { speed: 1.0, opacity: 0.0, fade: 1.0 }]], easing: easeInExpo },
      { time: 0.56, targets: [[this._u, { speed: 1.0, opacity: 1.0, fade: 1.0 }]], easing: easeInOutQuad },
    ]);

    this._mixer.play(clip, { wrapMode: 'once' });

    this._onBlackCheck = () => {
      if (!blackFired && this._u.opacity > 0.95) {
        blackFired = true;
        onBlack();
      }
    };
    this._onDoneCheck = null;
  }

  playReverse(onDone: () => void): void {
    this._mixer.stopAll();
    this._u.speed   = 1;
    this._u.opacity = 1;
    this._u.fade    = 1;
    this._elapsed   = 0;
    this._active    = true;
    let doneFired   = false;

    const clip = buildClip('warp-reverse', [
      { time: 0.00, targets: [[this._u, { speed: 1.0, opacity: 1.0, fade: 1.0 }]] },
      { time: 0.18, targets: [[this._u, { speed: 0.85, opacity: 0.0, fade: 1.0 }]], easing: easeOutExpo },
      { time: 0.55, targets: [[this._u, { speed: 0.0,  opacity: 0.0, fade: 1.0 }]], easing: easeOutExpo },
      { time: 0.80, targets: [[this._u, { speed: 0.0,  opacity: 0.0, fade: 0.0 }]], easing: easeInOutQuad },
    ]);

    this._mixer.play(clip, { wrapMode: 'once' });

    this._onBlackCheck = null;
    this._onDoneCheck  = () => {
      if (!doneFired && this._elapsed >= 0.81) {
        doneFired    = true;
        this._active = false;
        onDone();
      }
    };
  }

  update(delta: number, time: number): void {
    if (!this._active) return;
    this._elapsed += delta;
    this._mixer.update(delta);

    this._params.speed   = this._u.speed;
    this._params.opacity = this._u.opacity;
    this._params.fade    = this._u.fade;
    this._params.time    = time;

    this._onBlackCheck?.();
    this._onDoneCheck?.();

    if (!this._active) {
      // u_fade reached 0 — canvas is already transparent, just clear the buffer
      this._renderer.setClearColor(0x000000, 0);
      this._renderer.clear();
      return;
    }

    this._renderer.render(this._scene, this._camera);
  }

  setColor(r: number, g: number, b: number): void {
    this._params.color = [r, g, b];
  }

  get isActive(): boolean { return this._active; }
}
