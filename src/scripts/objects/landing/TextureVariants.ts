// src/scripts/objects/landing/TextureVariants.ts
// Static manifest of which lower-resolution AVIF variants actually exist on
// disk for each master texture (generated once via a local, non-repo Sharp
// script — see handover.md Phase 26 — never regenerated at runtime). Only
// lists variants that were verified smaller than their source; a handful of
// already-small masters (radial-glow-5, Uranus's `low` tier) produced no real
// win on re-encode and were deliberately not generated.

import type { TextureVariantTier } from '@triforge/render-budget-core';

// Smallest to largest. 'high' always resolves to the original file and is
// never looked up in the manifest below.
const TIER_ORDER: Exclude<TextureVariantTier, 'high'>[] = ['potato', 'low', 'mid'];

// Keyed by the master file's site-root path (without extension).
const AVAILABLE_VARIANTS: Record<string, Array<'mid' | 'low' | 'potato'>> = {
  '/textures/solarsystem/planets/earth/8k_earth_clouds':        ['mid', 'low', 'potato'],
  '/textures/solarsystem/planets/earth/8k_earth_daymap':        ['mid', 'low', 'potato'],
  '/textures/solarsystem/planets/earth/8k_earth_nightmap':      ['mid', 'low', 'potato'],
  '/textures/solarsystem/planets/earth/8k_earth_specular_map':  ['mid', 'low', 'potato'],
  '/textures/solarsystem/planets/jupiter/8k_jupiter':           ['mid', 'low', 'potato'],
  '/textures/solarsystem/planets/mars/8k_mars':                 ['mid', 'low', 'potato'],
  '/textures/solarsystem/planets/mars/mars-cloud-texture':      ['low', 'potato'],
  '/textures/solarsystem/planets/mercury/mercury-texture':      ['low', 'potato'],
  '/textures/solarsystem/planets/neptune/2k_neptune':           ['low', 'potato'],
  '/textures/solarsystem/planets/saturn/8k_saturn':             ['mid', 'low', 'potato'],
  '/textures/solarsystem/planets/uranus/2k_uranus':              ['potato'],
  '/textures/solarsystem/planets/venus/venus-cloud-texture':    ['low', 'potato'],
  '/textures/solarsystem/planets/venus/venus-texture':          ['low', 'potato'],
  '/textures/solarsystem/star/sun/sun-texture':                 ['low', 'potato'],
};

/**
 * Resolves a master texture URL to the best available variant for the given
 * tier. Never returns a smaller/lossier file than what was actually asked
 * for — if the requested tier (or anything smaller) has no generated file,
 * climbs back up toward the original rather than silently over-compressing.
 */
export function resolveTierUrl(url: string, tier: TextureVariantTier): string {
  if (tier === 'high') return url;

  const dot = url.lastIndexOf('.');
  const base = dot === -1 ? url : url.slice(0, dot);
  const available = AVAILABLE_VARIANTS[base];
  if (!available) return url;

  const startIdx = TIER_ORDER.indexOf(tier);
  for (let i = startIdx; i < TIER_ORDER.length; i++) {
    const t = TIER_ORDER[i];
    if (available.includes(t)) return `${base}.${t}.avif`;
  }
  return url;
}
