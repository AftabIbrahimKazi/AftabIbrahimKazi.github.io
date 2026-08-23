All planet spheres use `THREE.SphereGeometry`, not `@triforge/radius-parametric-geometry`.

**What:** The triforge geometry-nodes package was tried for planet spheres and reverted.
**Why:** Produced a visible UV seam tear on Saturn/Uranus/Neptune. Not revisited since — asteroid belt scatter still uses `@triforge/geometry-nodes` fine, this is sphere-geometry-specific.
**How to apply:** Don't re-attempt `radius-parametric-geometry` for planet spheres without first confirming upstream fixed the UV seam issue.
