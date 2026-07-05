// src/scripts/animations/landing/LandingRenderLoop.ts
// Single per-frame loop for the landing page — mirrors the sol-side RenderLoop.
// Ticks every animated subsystem, then renders the nebula scene. The carousel
// planets render inside their own per-canvas renderers but are driven from
// this loop so the page has exactly one requestAnimationFrame chain.

import * as THREE from 'three';
import { LandingEngine }             from '../../core/landing/LandingEngine';
import { LandingAsteroidsAnimation } from './LandingAsteroidsAnimation';
import { LandingScrollCamera }       from '../../controllers/landing/LandingScrollCamera';
import { CarouselPlanets }           from '../../ui/landing/CarouselPlanets';

export class LandingRenderLoop {

  private engine:              LandingEngine;
  private asteroidsAnimation:  LandingAsteroidsAnimation;
  private scrollCamera:        LandingScrollCamera;
  private carouselPlanets:     CarouselPlanets;

  private _running = false;
  private _timer   = new THREE.Timer();

  constructor(
    engine:             LandingEngine,
    asteroidsAnimation: LandingAsteroidsAnimation,
    scrollCamera:       LandingScrollCamera,
    carouselPlanets:    CarouselPlanets,
  ) {
    this.engine             = engine;
    this.asteroidsAnimation = asteroidsAnimation;
    this.scrollCamera       = scrollCamera;
    this.carouselPlanets    = carouselPlanets;
  }

  start(): void { if (this._running) return; this._running = true; this._loop(); }
  stop():  void { this._running = false; }

  private _loop(): void {
    if (!this._running) return;
    requestAnimationFrame(() => this._loop());
    this._timer.update();
    const elapsed = this._timer.getElapsed();

    this.asteroidsAnimation.update();
    this.scrollCamera.update();
    this.carouselPlanets.update(elapsed);

    this.engine.renderer.render(this.engine.scene, this.engine.camera);
  }
}
