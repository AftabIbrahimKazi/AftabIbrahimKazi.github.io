// src/scripts/environment/landing/NebulaScene.ts
// Procedural nebula sky — exact port of examples/cross-package/example-space-hdr.html.
// Uses @triforge/shader-core nodes. Parameters unchanged from the fine-tuned example.

import * as THREE from 'three';
import {
  MaterialOutput, Emission,
  MixRGB, ColorRamp, NoiseTexture, VoronoiTexture,
  MapRange, ShaderMath as ShaderMathNode, TextureCoordinate, Mapping,
} from '@triforge/shader-core';

// ── Colour helpers (verbatim from example) ───────────────────────────────────

function hexToHSL(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1,3),16)/255;
  const g = parseInt(hex.slice(3,5),16)/255;
  const b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0;
  const l = (max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = (g-b)/d + (g<b?6:0); break;
      case g: h = (b-r)/d + 2; break;
      case b: h = (r-g)/d + 4; break;
    }
    h /= 6;
  }
  return [h*360, s*100, l*100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const q = l < 0.5 ? l*(1+s) : l+s-l*s;
  const p = 2*l - q;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t<0) t+=1; if (t>1) t-=1;
    if (t<1/6) return p+(q-p)*6*t;
    if (t<1/2) return q;
    if (t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  const toH = (x: number) => Math.round(Math.min(1,Math.max(0,x))*255).toString(16).padStart(2,'0');
  if (s === 0) { const v = toH(l); return `#${v}${v}${v}`; }
  return `#${toH(hue2rgb(p,q,h+1/3))}${toH(hue2rgb(p,q,h))}${toH(hue2rgb(p,q,h-1/3))}`;
}

function nebStops(hex: string): string[] {
  const [h, s, l] = hexToHSL(hex);
  return [
    '#000000',
    hslToHex(h, s, Math.max(l*0.08, 1)),
    hslToHex(h, s, Math.max(l*0.25, 2)),
    hex,
    hslToHex(h, Math.max(s-20,10), Math.min(l*1.7, 88)),
  ];
}

function coreStops(hex: string): string[] {
  const [h, s, l] = hexToHSL(hex);
  return [
    '#000000',
    hslToHex(h, Math.max(s-10,15), Math.min(l*1.35, 72)),
    hslToHex(h, Math.max(s-25,10), Math.min(l*2.0,  90)),
  ];
}

// ── Exact defaults from the fine-tuned example ───────────────────────────────

const S = {
  s1scale: 50,  s1size: 0.015, s1bri: 3,
  s2scale: 30,  s2size: 0.05,  s2bri: 5,
  bshape:  0.25, bsrough: 0.75, bdetail: 5,  bdrough: 0.25,
  bthlo:   0.35, bthhi:   0.65, bcorlo:  0.6, bcorhi:  0.75,
  rshape:  1,    rsrough: 0.75, rdetail: 15, rdrough: 0.75,
  rthlo:   0.25, rthhi:   0.4,  rfrlo:   0.5, rfrhi:   0.9,
  bgscale: 4,    bgrough: 1,    bgthlo:  0.4, bgthhi:  0.55,
  emstr:   0.75, expo:    3,
  blueColor: '#ffffff',
  redColor:  '#2453e0',
};

// ── Build sky material (verbatim node graph from example) ────────────────────

function buildSkyMaterial(): THREE.ShaderMaterial {
  const tc = new TextureCoordinate();

  // Stars
  const sv1 = new VoronoiTexture({ vector: tc.output('Normal'), scale: S.s1scale, feature: 'F1' });
  const sr1  = new MapRange({ value: sv1.output('Distance'), fromMin:0, fromMax:S.s1size, toMin:S.s1bri, toMax:0, clamp:true });
  const sc1  = new ColorRamp({ fac: sr1.output('Result'), stops: ['#000000','#aabbff'] });

  const sv2 = new VoronoiTexture({ vector: tc.output('Normal'), scale: S.s2scale, feature: 'F1' });
  const sr2  = new MapRange({ value: sv2.output('Distance'), fromMin:0, fromMax:S.s2size, toMin:S.s2bri, toMax:0, clamp:true });
  const sc2  = new ColorRamp({ fac: sr2.output('Result'), stops: ['#000000','#ffe8cc'] });

  const allStars = new MixRGB({ mode:'ADD', fac:1, colorA:sc1.output('Color'), colorB:sc2.output('Color') });

  // Blue nebula
  const bmap   = new Mapping({ vector: tc.output('Normal'), location:[0.4,0.3,-0.2] as [number,number,number] });
  const bLarge = new NoiseTexture({ vector:bmap.output('Vector'), scale:S.bshape,  detail:4, roughness:S.bsrough });
  const bFine  = new NoiseTexture({ vector:bmap.output('Vector'), scale:S.bdetail, detail:4, roughness:S.bdrough });
  const bMul   = new ShaderMathNode({ mode:'MULTIPLY', a:bLarge.output('Fac'), b:bFine.output('Fac') });
  const bBoost = new MapRange({ value:bMul.output('Value'), fromMin:S.bthlo, fromMax:S.bthhi, toMin:0, toMax:1, clamp:true });
  const bColor = new ColorRamp({ fac:bBoost.output('Result'), stops:nebStops(S.blueColor) });
  const bCore  = new MapRange({ value:bLarge.output('Fac'), fromMin:S.bcorlo, fromMax:S.bcorhi, toMin:0, toMax:1, clamp:true });
  const bCoreC = new ColorRamp({ fac:bCore.output('Result'), stops:coreStops(S.blueColor) });
  const blueNeb = new MixRGB({ mode:'ADD', fac:1, colorA:bColor.output('Color'), colorB:bCoreC.output('Color') });

  // Red nebula
  const rmap   = new Mapping({ vector: tc.output('Normal'), location:[-0.5,-0.2,0.4] as [number,number,number] });
  const rLarge = new NoiseTexture({ vector:rmap.output('Vector'), scale:S.rshape,  detail:4, roughness:S.rsrough });
  const rFine  = new NoiseTexture({ vector:rmap.output('Vector'), scale:S.rdetail, detail:4, roughness:S.rdrough });
  const rMul   = new ShaderMathNode({ mode:'MULTIPLY', a:rLarge.output('Fac'), b:rFine.output('Fac') });
  const rBoost = new MapRange({ value:rMul.output('Value'), fromMin:S.rthlo, fromMax:S.rthhi, toMin:0, toMax:1, clamp:true });
  const rColor = new ColorRamp({ fac:rBoost.output('Result'), stops:nebStops(S.redColor) });
  const rFring = new MapRange({ value:rLarge.output('Fac'), fromMin:S.rfrlo, fromMax:S.rfrhi, toMin:0, toMax:1, clamp:true });
  const rFrigC = new ColorRamp({ fac:rFring.output('Result'), stops:coreStops(S.redColor) });
  const redNeb  = new MixRGB({ mode:'ADD', fac:1, colorA:rColor.output('Color'), colorB:rFrigC.output('Color') });

  // Background
  const bgN   = new NoiseTexture({ vector:tc.output('Normal'), scale:S.bgscale, detail:3, roughness:S.bgrough });
  const bgMap = new MapRange({ value:bgN.output('Fac'), fromMin:S.bgthlo, fromMax:S.bgthhi, toMin:0, toMax:1, clamp:true });
  const bgCol = new ColorRamp({ fac:bgMap.output('Result'), stops:['#000000','#0a0008','#1a0815'] });

  // Compose
  const nebulas  = new MixRGB({ mode:'ADD', fac:1, colorA:blueNeb.output('Color'), colorB:redNeb.output('Color') });
  const withBg   = new MixRGB({ mode:'ADD', fac:1, colorA:nebulas.output('Color'), colorB:bgCol.output('Color') });
  const withStar = new MixRGB({ mode:'ADD', fac:1, colorA:withBg.output('Color'),  colorB:allStars.output('Color') });
  const emit     = new Emission({ color:withStar.output('Color'), strength:S.emstr });

  const skyOut = new MaterialOutput({ surface:emit.output('BSDF') });
  skyOut.compile();
  skyOut.material.side       = THREE.BackSide;
  skyOut.material.depthWrite = false;

  return skyOut.material;
}

// ── NebulaScene ──────────────────────────────────────────────────────────────

export class NebulaScene {

  readonly skyMesh: THREE.Mesh;
  readonly exposure = S.expo;

  constructor(scene: THREE.Scene) {
    const mat = buildSkyMaterial();
    this.skyMesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 32), mat);
    this.skyMesh.renderOrder = -1;
    scene.add(this.skyMesh);
  }
}
