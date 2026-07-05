// src/scripts/core/solar-system/SolOrchestrator.ts
// Sol-domain orchestrator — owns the dependency graph for the solar-system
// scene. Logic moved verbatim from main.ts (E-01: entry files bootstrap only).
// The compileAsync → loop.start() sequencing is warp-critical: shaders
// pre-compile behind the veil so the reverse warp reveals a stutter-free
// scene already parked at the ?target= planet.

import * as THREE from 'three';
import { SolEngine }                from './SolEngine';
import { EnvironmentManager }       from '../../environment/solar-system/EnvironmentManager';
import { BasePlanet }               from '../../objects/solar-system/BasePlanet';
import { ControllerManager }        from '../../controllers/solar-system/ControllerManager';
import { AnimationManager }         from '../../animations/solar-system/AnimationManager';
import { RenderLoop }               from '../../animations/solar-system/RenderLoop';
import { PlanetScrollCamera }       from '../../ui/solar-system/PlanetScrollCameras';
import { ExploreOverlayController } from '../../ui/solar-system/ExploreOverlayController';

export class SolOrchestrator {

  private _engine!:      SolEngine;
  private _environment!: EnvironmentManager;
  private _objects!:     BasePlanet;
  private _controllers!: ControllerManager;
  private _animations!:  AnimationManager;
  private _scrollCams!:  Record<string, PlanetScrollCamera>;
  private _loop!:        RenderLoop;

  init(): void {
    this._engine = new SolEngine('#ex-main-canvas-ts');
    if (!this._engine.isReady) return;

    this._environment = new EnvironmentManager(this._engine.scene, this._engine.renderer);
    this._environment.init();

    this._objects     = new BasePlanet(this._engine.scene);
    this._controllers = new ControllerManager(this._engine.scene, this._engine.camera, this._engine.renderer, this._objects);
    this._animations  = new AnimationManager(this._objects);

    const cam = () => new PlanetScrollCamera(this._engine.camera, this._controllers.camera, this._engine.scene);
    this._scrollCams = {
      mercury: cam(), venus: cam(), earth: cam(), mars: cam(), jupiter: cam(),
      saturn: cam(), uranus: cam(), neptune: cam(), sun: cam(),
    };

    const s = this._scrollCams;
    this._loop = new RenderLoop(
      this._engine.renderer, this._engine.scene, this._engine.camera, this._controllers, this._animations,
      s.mercury, s.venus, s.earth, s.mars, s.jupiter, s.saturn, s.uranus, s.neptune, s.sun,
    );

    const targetParam = new URLSearchParams(window.location.search).get('target');
    if (targetParam) this._snapToTarget(targetParam);

    // Pre-compile all shaders before starting the render loop.
    // Eliminates per-planet lazy-compile stutter as the camera sweeps through
    // the scene. The warp canvas runs on its own renderer so it plays
    // unaffected during compilation.
    this._engine.renderer.compileAsync(this._engine.scene, this._engine.camera).then(() => {
      this._loop.start();

      new ExploreOverlayController(
        s.mercury, s.venus, s.earth, s.mars, s.jupiter, s.saturn, s.uranus, s.neptune, s.sun,
      );

      if (targetParam) this._enterExploreMode(targetParam);
    });
  }

  // If arriving from the landing carousel, snap the camera to the target
  // planet before compileAsync so the very first rendered frame is already
  // at the destination.
  private _snapToTarget(targetParam: string): void {
    const meshMap: Record<string, { mesh: THREE.Object3D; offset: THREE.Vector3 }> = {
      sun:     { mesh: this._objects.sun.mesh,     offset: new THREE.Vector3(22,  9,   38) },
      mercury: { mesh: this._objects.mercury.mesh, offset: new THREE.Vector3(5,   2,   8)  },
      venus:   { mesh: this._objects.venus.mesh,   offset: new THREE.Vector3(6,   2.5, 10) },
      earth:   { mesh: this._objects.earth.mesh,   offset: new THREE.Vector3(6,   2.5, 10) },
      mars:    { mesh: this._objects.mars.mesh,    offset: new THREE.Vector3(5,   2,   8)  },
      jupiter: { mesh: this._objects.jupiter.mesh, offset: new THREE.Vector3(20,  8,   30) },
      saturn:  { mesh: this._objects.saturn.mesh,  offset: new THREE.Vector3(24,  10,  36) },
      uranus:  { mesh: this._objects.uranus.mesh,  offset: new THREE.Vector3(10,  4,   16) },
      neptune: { mesh: this._objects.neptune.mesh, offset: new THREE.Vector3(10,  4,   16) },
    };
    const entry = meshMap[targetParam];
    if (!entry) return;

    const planetPos = new THREE.Vector3();
    entry.mesh.getWorldPosition(planetPos);
    this._engine.camera.position.copy(planetPos).add(entry.offset);
    this._controllers.camera.controls.target.copy(planetPos);
    this._controllers.camera.controls.update();
  }

  private _enterExploreMode(targetParam: string): void {
    const keyMap: Record<string, string> = {
      sun:     'ex-sun-js',
      mercury: 'ex-mercury-js',
      venus:   'ex-venus-js',
      earth:   'ex-earth-js',
      mars:    'ex-mars-js',
      jupiter: 'ex-jupiter-js',
      saturn:  'ex-saturn-js',
      uranus:  'ex-uranus-js',
      neptune: 'ex-neptune-js',
    };
    const planetKey = keyMap[targetParam];
    if (!planetKey) return;

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('ct:explore-mode', { detail: { planetKey } }));
    }, 600);
  }
}
