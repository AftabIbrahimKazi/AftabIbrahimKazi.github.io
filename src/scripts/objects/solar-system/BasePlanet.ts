// src/scripts/objects/solar-system/BasePlanet.ts
// ─────────────────────────────────────────────────────────────
//  THE SOLAR SYSTEM ORCHESTRATOR.
//  Instantiates every celestial body in scene order.
//  main.ts calls: new BasePlanet(scene)
//  Everything else reads from its public properties.
// ─────────────────────────────────────────────────────────────

import * as THREE from 'three';

import { Sun }         from './sun/Sun';
import { Mercury }     from './mercury/Mercury';
import { Venus }       from './venus/Venus';
import { Earth }       from './earth/Earth';
import { Mars }        from './mars/Mars';
import { AsteroidBelt } from './AsteroidBelt';
import { Jupiter }     from './jupiter/Jupiter';
import { Saturn }      from './saturn/Saturn';
import { Uranus }      from './uranus/Uranus';
import { Neptune }     from './neptune/Neptune';

export class BasePlanet {

  //these declarations ("readonly sun:       Sun;" for example) are not needed at run time but are needed by typescript to help in debugging commingting them out wont break the code but will render typescripts ability to help in debugging.

  readonly sun:       Sun;
  readonly mercury:   Mercury;
  readonly venus:     Venus;
  readonly earth:     Earth;
  readonly mars:      Mars;
  readonly asteroids: AsteroidBelt;
  readonly jupiter:   Jupiter;
  readonly saturn:    Saturn;
  readonly uranus:    Uranus;
  readonly neptune:   Neptune;

  //we used constructor because the development plan was not set i.e the future changes in the project asre not set in stone and constructor offers that flexibility so we chose that over a function taht said in the current state of just initializing the varided child function usng a parent function instead of a constructor would do just as fine.
  constructor(scene: THREE.Scene) {
  // you can call the functions directly but then the code dosenot remaons future proof. lets say if you dont store the functions inside a variable referencing them later in future logics will become a problem as the objects will be lost in the scene due to lack of reference. so yes we need those variables here.

    this.sun       = new Sun(scene);
    this.mercury   = new Mercury(scene);
    this.venus     = new Venus(scene);
    this.earth     = new Earth(scene);
    this.mars      = new Mars(scene);
    this.asteroids = new AsteroidBelt(scene);
    this.jupiter   = new Jupiter(scene);
    this.saturn    = new Saturn(scene);
    this.uranus    = new Uranus(scene);
    this.neptune   = new Neptune(scene);
  }
}
