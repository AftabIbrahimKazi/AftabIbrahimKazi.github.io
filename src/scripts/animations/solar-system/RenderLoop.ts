// src/scripts/animations/RenderLoop.ts

import * as THREE from 'three';
import { ControllerManager } from '../../controllers/solar-system/ControllerManager';
import { AnimationManager }  from './AnimationManager';
import { PlanetScrollCamera } from '../../ui/solar-system/PlanetScrollCameras';

export class RenderLoop {

  private renderer:    THREE.WebGLRenderer;
  private scene:       THREE.Scene;
  private camera:      THREE.PerspectiveCamera;
  private controllers: ControllerManager;
  private animations:  AnimationManager;

  private mercuryScrollCam: PlanetScrollCamera;
  private venusScrollCam:   PlanetScrollCamera;
  private earthScrollCam:   PlanetScrollCamera;
  private marsScrollCam:    PlanetScrollCamera;
  private jupiterScrollCam: PlanetScrollCamera;
  private saturnScrollCam:  PlanetScrollCamera;
  private uranusScrollCam:  PlanetScrollCamera;
  private neptuneScrollCam: PlanetScrollCamera;
  private sunScrollCam:     PlanetScrollCamera;

  private _running: boolean = false;
  private _timer = new THREE.Timer();

  constructor(
    renderer:    THREE.WebGLRenderer,
    scene:       THREE.Scene,
    camera:      THREE.PerspectiveCamera,
    controllers: ControllerManager,
    animations:  AnimationManager,
    mercuryScrollCam: PlanetScrollCamera,
    venusScrollCam:   PlanetScrollCamera,
    earthScrollCam:   PlanetScrollCamera,
    marsScrollCam:    PlanetScrollCamera,
    jupiterScrollCam: PlanetScrollCamera,
    saturnScrollCam:  PlanetScrollCamera,
    uranusScrollCam:  PlanetScrollCamera,
    neptuneScrollCam: PlanetScrollCamera,
    sunScrollCam:     PlanetScrollCamera,
  ) {
    this.renderer         = renderer;
    this.scene            = scene;
    this.camera           = camera;
    this.controllers      = controllers;
    this.animations       = animations;
    this.mercuryScrollCam = mercuryScrollCam;
    this.venusScrollCam   = venusScrollCam;
    this.earthScrollCam   = earthScrollCam;
    this.marsScrollCam    = marsScrollCam;
    this.jupiterScrollCam = jupiterScrollCam;
    this.saturnScrollCam  = saturnScrollCam;
    this.uranusScrollCam  = uranusScrollCam;
    this.neptuneScrollCam = neptuneScrollCam;
    this.sunScrollCam     = sunScrollCam;
  }

  start(): void { if (this._running) return; this._running = true; this._loop(); }
  stop():  void { this._running = false; }

  private _loop(): void {
    if (!this._running) return;
    requestAnimationFrame(() => this._loop());
    this._timer.update();
    const delta = this._timer.getDelta();

    this.animations.sunAnimation.update(delta);
    this.animations.mercuryAnimation.update(delta);
    this.animations.venusAnimation.update(delta);
    this.animations.earthAnimation.update(delta);
    this.animations.marsAnimation.update(delta);
    this.animations.jupiterAnimation.update(delta);
    this.animations.saturnAnimation.update(delta);
    this.animations.uranusAnimation.update(delta);
    this.animations.neptuneAnimation.update(delta);

    this.mercuryScrollCam.update();
    this.venusScrollCam.update();
    this.earthScrollCam.update();
    this.marsScrollCam.update();
    this.jupiterScrollCam.update();
    this.saturnScrollCam.update();
    this.uranusScrollCam.update();
    this.neptuneScrollCam.update();
    this.sunScrollCam.update();

    this.controllers.interaction.updateTooltipLiveData();
    this.controllers.camera.updateFollowTarget();
    this.controllers.camera.updatePlanetButton();
    this.controllers.camera.update();
    this.renderer.render(this.scene, this.camera);
  }
}
