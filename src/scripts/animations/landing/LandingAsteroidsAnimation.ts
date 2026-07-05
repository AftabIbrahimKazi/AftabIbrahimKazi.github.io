// src/scripts/animations/landing/LandingAsteroidsAnimation.ts
// Per-frame spin + tumble for the landing background asteroids.
// Mirrors the sol-side pattern: the object file owns geometry and materials,
// the animation class owns all per-frame mutation.

import * as THREE from 'three';
import { LandingAsteroids } from '../../objects/landing/LandingAsteroids';

export class LandingAsteroidsAnimation {

  private readonly _asteroids: LandingAsteroids;
  private readonly _dummy  = new THREE.Object3D();
  private readonly _qDelta = new THREE.Quaternion();
  private readonly _axis   = new THREE.Vector3();

  constructor(asteroids: LandingAsteroids) {
    this._asteroids = asteroids;
  }

  update(): void {
    const meshes    = this._asteroids.meshes;
    const instances = this._asteroids.instances;

    for (let vi = 0; vi < meshes.length; vi++) {
      const mesh = meshes[vi];
      const set  = instances[vi];

      for (let i = 0; i < set.length; i++) {
        const inst = set[i];

        this._qDelta.setFromAxisAngle(inst.spinAxis, inst.spinSpeed);
        inst.rot.premultiply(this._qDelta);

        this._axis.set(0, 1, 0);
        this._qDelta.setFromAxisAngle(this._axis, inst.tumbleX);
        inst.rot.premultiply(this._qDelta);

        this._axis.set(1, 0, 0);
        this._qDelta.setFromAxisAngle(this._axis, inst.tumbleZ);
        inst.rot.premultiply(this._qDelta);

        inst.rot.normalize();

        this._dummy.position.copy(inst.pos);
        this._dummy.quaternion.copy(inst.rot);
        this._dummy.scale.setScalar(inst.scale);
        this._dummy.updateMatrix();
        mesh.setMatrixAt(i, this._dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
    }
  }
}
