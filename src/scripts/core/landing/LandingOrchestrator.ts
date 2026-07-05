// src/scripts/core/landing/LandingOrchestrator.ts
// Landing-domain orchestrator — owns the dependency graph for the landing
// scene. Instantiates and wires the engine, scene objects, camera control,
// animations, and render loop. The entry file (landing.ts) only instantiates
// and calls init().

import { LandingEngine }             from './LandingEngine';
import { LandingEnvironment }        from '../../environment/landing/LandingEnvironment';
import { LandingAsteroids }          from '../../objects/landing/LandingAsteroids';
import { LandingScrollCamera }       from '../../controllers/landing/LandingScrollCamera';
import { CarouselPlanets }           from '../../ui/landing/CarouselPlanets';
import { LandingAsteroidsAnimation } from '../../animations/landing/LandingAsteroidsAnimation';
import { LandingRenderLoop }         from '../../animations/landing/LandingRenderLoop';

export class LandingOrchestrator {

  private _engine!:             LandingEngine;
  private _environment!:        LandingEnvironment;
  private _asteroids!:          LandingAsteroids;
  private _scrollCam!:          LandingScrollCamera;
  private _carouselPlanets!:    CarouselPlanets;
  private _asteroidsAnimation!: LandingAsteroidsAnimation;
  private _loop!:               LandingRenderLoop;

  init(): void {
    this._engine = new LandingEngine('ex-nebula-canvas');

    this._environment = new LandingEnvironment(this._engine.scene);
    this._environment.init();

    this._asteroids = new LandingAsteroids(this._engine.scene);

    this._scrollCam = new LandingScrollCamera(this._engine.camera);
    this._scrollCam.init();

    this._carouselPlanets = new CarouselPlanets();
    this._carouselPlanets.init();

    this._asteroidsAnimation = new LandingAsteroidsAnimation(this._asteroids);

    this._loop = new LandingRenderLoop(
      this._engine, this._asteroidsAnimation, this._scrollCam, this._carouselPlanets,
    );
    this._loop.start();

    this._prefetchSol();
  }

  private _prefetchSol(): void {
    const link = document.createElement('link');
    link.rel  = 'prefetch';
    link.href = '/sol';
    document.head.appendChild(link);
  }
}
