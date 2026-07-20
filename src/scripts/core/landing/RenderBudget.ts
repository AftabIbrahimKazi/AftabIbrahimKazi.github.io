// src/scripts/core/landing/RenderBudget.ts
// Two-phase device/network render-budget resolution for the landing page.
//
// Phase 1 (`resolveHardwareCeiling`) MUST run before any real WebGL renderer
// exists on the page. @triforge/render-budget-core's hardware probe measures
// the browser's real context ceiling by deliberately creating scratch
// contexts until it's hit ("must run before any other WebGL consumer mounts
// — probing after the fact would compete with real contexts and could
// itself trigger the context loss this package exists to prevent," per the
// package's own DeviceProfiler.ts). This project's first attempt called the
// bundled `initRenderBudget()` from inside CarouselPlanets, which only runs
// after LandingEngine's nebula renderer already exists — verified via a real
// headless-browser run that this evicts the nebula's context ("Too many
// active WebGL contexts" / "THREE.WebGLRenderer: Context Lost").
//
// Phase 2 (`resolveFullPlan`) takes phase 1's already-resolved hardware
// profile and layers network profiling + override precedence on top by
// composing the package's individually-exported pieces (`profileNetwork`,
// `planBudget`, `getUserOverride`) directly, instead of calling the bundled
// `initRenderBudget()` a second time. The bundled function always re-runs
// its own internal `profileHardware()` — a second attempt that DID split
// hardware from network but still called `initRenderBudget()` for phase 2
// verified this: the nebula/warp renderers (alive by then) briefly lost and
// automatically regained their context during phase 2's redundant scratch-
// context probe. Composing the plan manually here avoids a second probe
// entirely, so there's nothing left to collide with.
//
// Deliberately NOT required before rendering starts: on browsers without the
// Network Information API (Safari/iOS), network profiling falls back to a
// real timed download, and per the package's own design that probe is never
// cached — gating the nebula's first paint on it would mean a recurring,
// possibly multi-second delay on exactly the connections this feature exists
// to help, every single visit. Only CarouselPlanets (below the fold, no
// visible content of its own until scrolled to) waits on phase 2.

import {
  profileHardware, profileNetwork, planBudget,
  createBrowserHardwareEnv, createBrowserNetworkEnv, getUserOverride,
} from '@triforge/render-budget-core';
import type { RenderBudgetPlan, HardwareProfile, RenderBudgetOverride, TextureVariantTier } from '@triforge/render-budget-core';

// Every currently registered orb still gets a turn if phase 2 stalls.
const DEFAULT_MAX_CONCURRENT = 10;

// Reuses a texture this page loads anyway as the timed-download network
// probe asset (~200KB — big enough that request overhead doesn't dominate
// the measurement); avoids the package's own fallback of re-fetching the
// current HTML document when navigator.connection is unavailable.
const PROBE_ASSET_URL = '/textures/solarsystem/planets/mercury/mercury-texture.avif';

// If phase 2 (network probe included) hasn't resolved by this deadline, fall
// back to a conservative plan for CarouselPlanets rather than hold its first
// render hostage to a possibly-stalled network request. Deliberately biased
// toward the *cheap* end, not 'full'/'high' — a probe that's slow because
// the network itself is slow should not then also serve that connection the
// heaviest textures.
const PROBE_TIMEOUT_MS = 3000;
const FALLBACK_PLAN: RenderBudgetPlan = {
  textureTier: 'low',
  textureFormat: 'avif',
  shaderComplexity: 'reduced',
  maxConcurrentContexts: DEFAULT_MAX_CONCURRENT,
  source: 'auto',
};

const TIER_ORDER: TextureVariantTier[] = ['potato', 'low', 'mid', 'high'];
function tierRank(tier: TextureVariantTier): number { return TIER_ORDER.indexOf(tier); }

function readDevForceQuality(): TextureVariantTier | null {
  const raw = new URLSearchParams(location.search).get('forceQuality');
  return raw === 'high' || raw === 'mid' || raw === 'low' || raw === 'potato' ? raw : null;
}

function defaultStorage() {
  if (typeof localStorage === 'undefined') return { getItem: () => null, setItem: () => {} };
  return localStorage;
}

/** Await before constructing any THREE.WebGLRenderer on the page. */
export function resolveHardwareCeiling(): Promise<HardwareProfile> {
  return profileHardware(createBrowserHardwareEnv());
}

/**
 * Safe to await later / concurrently with scene setup — only gates
 * CarouselPlanets. Reuses `hardware` (already resolved by phase 1) instead
 * of re-probing it.
 */
export function resolveFullPlan(hardware: Promise<HardwareProfile>): Promise<RenderBudgetPlan> {
  const full = hardware.then(async hw => {
    const storage = defaultStorage();
    const network = await profileNetwork(createBrowserNetworkEnv(PROBE_ASSET_URL));

    const userOverride = getUserOverride(storage);
    if (userOverride) return planBudget(hw, network, userOverride);

    const autoPlan = planBudget(hw, network, null);

    // Dev-only, and only allowed to force a WORSE tier than auto-detected —
    // never better — so a real visitor can't force an unsupported tier and
    // file an unreproducible bug.
    if (!import.meta.env.PROD) {
      const forced = readDevForceQuality();
      if (forced && tierRank(forced) < tierRank(autoPlan.textureTier)) {
        const override: RenderBudgetOverride = { textureTier: forced };
        return { ...planBudget(hw, network, override), source: 'manual-override' as const };
      }
    }

    return autoPlan;
  });

  return Promise.race([
    full,
    new Promise<RenderBudgetPlan>(resolve => setTimeout(() => resolve(FALLBACK_PLAN), PROBE_TIMEOUT_MS)),
  ]);
}
