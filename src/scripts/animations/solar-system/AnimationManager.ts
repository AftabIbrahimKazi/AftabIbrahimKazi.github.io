// src/scripts/animations/AnimationManager.ts
// ─────────────────────────────────────────────────────────────
//  ANIMATION ORCHESTRATOR — mirrors BasePlanet pattern exactly.
//  Instantiates every animation class in scene order.
//  Stores them as public properties for RenderLoop to access.
// ─────────────────────────────────────────────────────────────

import { BasePlanet } from '../../objects/solar-system/BasePlanet';

import { SunAnimation }     from './SunAnimation';
import { MercuryAnimation } from './MercuryAnimation';
import { VenusAnimation }   from './VenusAnimation';
import { EarthAnimation }   from './EarthAnimation';
import { MarsAnimation }    from './MarsAnimation';
import { JupiterAnimation } from './JupiterAnimation';
import { SaturnAnimation }  from './SaturnAnimation';
import { UranusAnimation }  from './UranusAnimation';
import { NeptuneAnimation } from './NeptuneAnimation';

export interface IAnimation {
  update(delta: number): void;
}

export class AnimationManager {

  readonly sunAnimation:     SunAnimation;
  readonly mercuryAnimation: MercuryAnimation;
  readonly venusAnimation:   VenusAnimation;
  readonly earthAnimation:   EarthAnimation;
  readonly marsAnimation:    MarsAnimation;
  readonly jupiterAnimation: JupiterAnimation;
  readonly saturnAnimation:  SaturnAnimation;
  readonly uranusAnimation:  UranusAnimation;
  readonly neptuneAnimation: NeptuneAnimation;

  constructor(planets: BasePlanet) {
    this.sunAnimation     = new SunAnimation(planets.sun);
    this.mercuryAnimation = new MercuryAnimation(planets.mercury);
    this.venusAnimation   = new VenusAnimation(planets.venus);
    this.earthAnimation   = new EarthAnimation(planets.earth);
    this.marsAnimation    = new MarsAnimation(planets.mars);
    this.jupiterAnimation = new JupiterAnimation(planets.jupiter);
    this.saturnAnimation  = new SaturnAnimation(planets.saturn);
    this.uranusAnimation  = new UranusAnimation(planets.uranus);
    this.neptuneAnimation = new NeptuneAnimation(planets.neptune);
  }
}
