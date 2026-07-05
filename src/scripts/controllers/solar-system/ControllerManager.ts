// src/scripts/controllers/solar-system/ControllerManager.ts
// ─────────────────────────────────────────────────────────────
//  CONTROLLER ORCHESTRATOR — mirrors BasePlanet/AnimationManager
//  pattern exactly. Instantiates child controllers and exposes
//  them as public properties. No logic lives here.
// ─────────────────────────────────────────────────────────────

import * as THREE                from 'three';
import { BasePlanet }            from '../../objects/solar-system/BasePlanet';
import { CameraController }      from './CameraController';
import { InteractionController } from './InteractionController';

export class ControllerManager {

  readonly camera:      CameraController;
  readonly interaction: InteractionController;

  constructor(
    scene:    THREE.Scene,
    camera:   THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    planets:  BasePlanet
  ) {
    const pivotMap = {
      'ex-mercury-js': planets.mercury.pivot,
      'ex-venus-js':   planets.venus.pivot,
      'ex-earth-js':   planets.earth.pivot,
      'ex-mars-js':    planets.mars.pivot,
      'ex-jupiter-js': planets.jupiter.pivot,
      'ex-saturn-js':  planets.saturn.pivot,
      'ex-uranus-js':  planets.uranus.pivot,
      'ex-neptune-js': planets.neptune.pivot,
    };

    this.camera      = new CameraController(camera, renderer);
    this.interaction = new InteractionController(scene, camera, this.camera, pivotMap);
  }
}
