// src/scripts/core/landing/LandingOrchestrator.ts
// Landing-domain orchestrator — owns the dependency graph for the landing
// scene. Instantiates and wires the engine, scene objects, camera control,
// animations, and render loop. The entry file (landing.ts) only instantiates
// and calls init().

import { LandingEngine }             from './LandingEngine';
import { resolveHardwareCeiling, resolveFullPlan } from './RenderBudget';
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

  async init(): Promise<void> {
    // Must resolve BEFORE any real WebGL renderer exists on the page — the
    // hardware probe measures the browser's context ceiling by deliberately
    // creating scratch contexts until it's hit, and will evict whichever
    // real context is oldest if one already exists when it runs (verified:
    // this evicted the nebula renderer when the probe lived inside
    // CarouselPlanets instead, which only runs after LandingEngine exists).
    // Network-independent — no first-paint delay risk from a slow connection.
    const hardware = await resolveHardwareCeiling();

    this._engine = new LandingEngine('ex-nebula-canvas');

    this._environment = new LandingEnvironment(this._engine.scene);
    this._environment.init();

    this._asteroids = new LandingAsteroids(this._engine.scene);

    this._scrollCam = new LandingScrollCamera(this._engine.camera);
    this._scrollCam.init();

    this._carouselPlanets = new CarouselPlanets();
    // The full plan (adds network profiling on top of the already-resolved
    // `hardware`, no second probe) resolves separately — CarouselPlanets
    // awaits it internally and no-ops in update() until then; it must not
    // block the nebula/asteroids/camera above.
    void this._carouselPlanets.init(resolveFullPlan(Promise.resolve(hardware)));

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
