// src/scripts/objects/solar-system/AsteroidBelt.ts

import * as THREE from 'three';
import {
  GeometryLiteral,
  DistributePointsOnFaces,
  SetPosition,
  evaluateGraph,
} from '@triforge/geometry-nodes';

export class AsteroidBelt {

  readonly pivot: null = null;
  readonly mesh: THREE.Object3D;

  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.mesh  = new THREE.Object3D();
    this.mesh.name = 'ex-asteroid-belt-anchor-js';
    this.scene.add(this.mesh);
    // DISABLED for performance testing — re-enable by uncommenting the line below.
    // requestAnimationFrame(() => requestAnimationFrame(() => this._build()));
  }

  private _build(): void {
    const innerRadius = 40;
    const outerRadius = 60;
    const beltHeight  = 2.0;
    const spread      = outerRadius - innerRadius;

    const buildRing = (count: number, outerBound: number, h: number): THREE.BufferGeometry => {
      const ring     = new THREE.RingGeometry(innerRadius, outerBound, 64, 6);
      const literal  = new GeometryLiteral(ring);
      const scatter  = new DistributePointsOnFaces({ mesh: literal.output('Geometry'), count });
      const elevated = new SetPosition({
        geometry: scatter.output('Points'),
        offset: () => [0, (Math.random() - 0.5) * h, 0],
      });
      return evaluateGraph(elevated.output('Geometry')) as THREE.BufferGeometry;
    };

    const emitterConfigs = [
      { name: 'ex-asteroid-dust-trail-js',  geo: buildRing(1500, innerRadius + spread,      beltHeight),        color: 0xb8a898, size: 0.08, opacity: 0.35 },
      { name: 'ex-asteroid-glow-points-js', geo: buildRing(800,  innerRadius + spread,      beltHeight * 0.75), color: 0xfff0d0, size: 0.15, opacity: 0.5  },
      { name: 'ex-asteroid-spark-cloud-js', geo: buildRing(1200, innerRadius + spread + 4,  beltHeight * 2.0),  color: 0xd4c4a8, size: 0.04, opacity: 0.2  },
      { name: 'ex-asteroid-debris-js',      geo: buildRing(800,  innerRadius + spread - 4,  beltHeight * 0.5),  color: 0x9a8870, size: 0.03, opacity: 0.45 },
    ];

    emitterConfigs.forEach(({ name, geo, color, size, opacity }) => {
      const points = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          color: new THREE.Color(color), size, transparent: true, opacity,
          sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending,
        })
      );
      points.name = name;
      this.scene.add(points);
    });
  }
}
