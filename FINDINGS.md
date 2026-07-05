# Triforge Findings

Gaps discovered while using triforge packages in real projects. To be addressed in future updates.

---

## st-shader-core

Source: Exo Space Planetarium (`Astro/planatarium-2`), which had to define three project-local custom nodes in `src/scripts/shader-nodes/CoreShaderNodes.ts` and `src/scripts/warp/WarpShaderNodes.ts`. Two of the three are missing library features.

### 1. No per-fragment alpha path to the material output — missing feature

`MaterialOutput` hardcodes alpha to 1.0, so a graph cannot express fresnel- or terminator-driven transparency. The consumer had to write a custom `RgbaOutput` node emitting `gl_FragColor = vec4(color, alpha)`.

**Blender reference:** alpha flows through the Alpha input on Principled BSDF (or Transparent BSDF + Mix Shader), not through Material Output. `PrincipledBSDF` already has an `alpha` input socket — the Blender-faithful fix is to plumb that alpha end-to-end through `MaterialOutput`, rather than adding a new RGBA output node.

### 2. Nothing can feed `ImageTexture.vector` — socket incompatibility, missing UV transform path

`vector` sockets are vec2, but every transform node (including Mapping) outputs vec3 `color`, so no node can legally drive texture UVs. This blocks the canonical UV-panning setup, and `THREE.Texture.offset` is ignored by raw ShaderMaterials. The consumer had to write a custom `UvPan` node with float x/y uniform inputs.

**Blender reference:** Texture Coordinate (UV) → Mapping (Location offset) → Image Texture Vector is the standard panning graph; Mapping's vector sockets carry 2D UVs fine. Fix: make vector-ish outputs (Mapping et al.) compatible with `vector` inputs. That makes a dedicated UvPan node unnecessary.

### 3. No loop construct — by design, but the escape hatch is generalisable

The planetarium's warp star field is a 16-layer × 3×3-cell raymarch loop, implemented as a custom `WarpStarfield` node with hand-written GLSL. Blender's shader editor also has no loops (Repeat Zones are Geometry Nodes only); its escape hatch is the OSL Script node, which is exactly what the custom-node API is. The loop itself needs no fix — but the escape hatch can be generalised (below) so future loop-based effects don't need a node subclass each.

#### Generalisation path — two complementary levels

**A. Generalise the mechanism: add a generic `GlslScript` node to shader-core.** ~90% of the `WarpStarfield` class is mechanical boilerplate: typed input-socket declarations, output declarations, and a `compileCall` that only resolves inputs into a function call and assigns outputs. Only `compileDefs` (the GLSL function) is unique. A library node of the shape:

```ts
new GlslScript({
  defs: `vec4 myEffect(vec2 uv, float speed, ...) { /* loops fine here */ }`,
  call: 'myEffect',
  inputs:  { speed: 'float', time: 'float', tint: 'color' },
  outputs: { Color: 'color', Lum: 'float' },
})
```

would auto-generate the sockets, uniform wiring, collision-safe name prefixing, and output-variable assignment. Direct analogue of Blender's OSL Script node, so it fits the design philosophy. Every future loop-based effect (nebula raymarch, volumetric clouds, rain streaks) then needs zero subclass code — just a GLSL string plus a socket manifest. **This is the high-leverage fix and belongs in shader-core.** It would also let the planetarium delete the `WarpStarfield` class shell (the GLSL survives as data).

**B. Generalise the visual: parameterise the starfield into a `LayeredParticleField` node.** The warp look is controlled by hardcoded constants (layer count, cell size, layer spacing, focal length, near/far clipping) plus baked-in choices — quadratic speed→trail mapping and a three-band hardcoded star palette. Promoting those to node options/inputs makes the same loop produce different visuals: trail ≈ 0 gives a calm drifting starfield (the dot-rendering branch already exists); reparametrised cell/spacing/speed gives snow, rain streaks, depth dust, or slower hyperspace; the palette bands become color inputs. **Do this only when a second effect actually wants the layered-grid projection** — generalising parameters before a second consumer exists tends to guess the wrong knobs.

---

*Recorded 2026-07-06.*
