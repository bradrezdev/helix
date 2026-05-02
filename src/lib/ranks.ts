// ─── Ranks — Single Source of Truth ───────────────────────────────────────────
// All 12 ranks from ONANO compensation plan (avance-de-rango.md).
// Every frontend file MUST import from here instead of defining inline constants.

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface RankRequirements {
  pv: number
  groupVg?: number
  longestLeg?: number
  shortestLeg?: number
}

// ─── Order ──────────────────────────────────────────────────────────────────────

export const RANK_ORDER = [
  'Socio',
  'Ejecutivo',
  'Bronce',
  'Plata',
  'Oro',
  'Platino',
  'Diamante',
  'Doble Diamante',
  'Triple Diamante',
  'Diamante Embajador',
  'Doble Diamante Embajador',
  'Triple Diamante Embajador',
] as const

export type RankSlug = (typeof RANK_ORDER)[number]

// ─── PV Thresholds ──────────────────────────────────────────────────────────────
// Minimum PV required for each rank (all=100 except Socio=0).

export const RANK_PV_THRESHOLDS: Record<string, number> = {
  Socio: 0,
  Ejecutivo: 100,
  Bronce: 100,
  Plata: 100,
  Oro: 100,
  Platino: 100,
  Diamante: 100,
  'Doble Diamante': 100,
  'Triple Diamante': 100,
  'Diamante Embajador': 100,
  'Doble Diamante Embajador': 100,
  'Triple Diamante Embajador': 100,
}

// ─── Requirements ───────────────────────────────────────────────────────────────
// Real rank requirements from ONANO compensation plan (ProgressRankCard format).

export const RANK_REQUIREMENTS: Record<string, RankRequirements> = {
  Socio:                       { pv: 0 },
  Ejecutivo:                   { pv: 100 },
  Bronce:                      { pv: 100, groupVg: 1000 },
  Plata:                       { pv: 100, groupVg: 3000,   longestLeg: 1800,  shortestLeg: 1200 },
  Oro:                         { pv: 100, groupVg: 5000,   longestLeg: 3000,  shortestLeg: 2000 },
  Platino:                     { pv: 100, groupVg: 10000,  longestLeg: 6000,  shortestLeg: 4000 },
  Diamante:                    { pv: 100, groupVg: 25000,  longestLeg: 15000, shortestLeg: 10000 },
  'Doble Diamante':            { pv: 100, groupVg: 50000,  longestLeg: 30000, shortestLeg: 20000 },
  'Triple Diamante':           { pv: 100, groupVg: 100000, longestLeg: 60000, shortestLeg: 40000 },
  'Diamante Embajador':        { pv: 100, groupVg: 250000, longestLeg: 150000, shortestLeg: 100000 },
  'Doble Diamante Embajador':  { pv: 100, groupVg: 500000, longestLeg: 300000, shortestLeg: 200000 },
  'Triple Diamante Embajador': { pv: 100, groupVg: 1000000, longestLeg: 600000, shortestLeg: 400000 },
}

// ─── Colors ─────────────────────────────────────────────────────────────────────

export const RANK_COLORS: Record<string, string> = {
  Socio: '#9CA3AF',                    // gray
  Ejecutivo: '#6B7280',                // gray-500
  Bronce: '#CD7F32',                   // bronze
  Plata: '#C0C0C0',                    // silver
  Oro: '#FFD700',                      // gold
  Platino: '#E5E4E2',                  // platinum
  Diamante: '#00BFFF',                 // deep-sky-blue
  'Doble Diamante': '#4169E1',         // royal-blue
  'Triple Diamante': '#6A0DAD',       // purple
  'Diamante Embajador': '#8B0000',     // dark-red
  'Doble Diamante Embajador': '#DC143C', // crimson
  'Triple Diamante Embajador': '#FFD700', // gold
}

// ─── Images ─────────────────────────────────────────────────────────────────────
// Paths relative to public/. Socio has no image (falls back to initials).

export const RANK_IMAGES: Record<string, string> = {
  Ejecutivo: '/rangos/ejecutivo.svg',
  Bronce: '/rangos/bronce.png',
  Plata: '/rangos/plata.png',
  Oro: '/rangos/oro.png',
  Platino: '/rangos/platino.png',
  Diamante: '/rangos/diamante.png',
  'Doble Diamante': '/rangos/double-diamond.png',
  'Triple Diamante': '/rangos/triple-diamond.png',
  'Diamante Embajador': '/rangos/diamante-embajador.svg',
  'Doble Diamante Embajador': '/rangos/doble-diamante-embajador.svg',
  'Triple Diamante Embajador': '/rangos/triple-diamante-embajador.svg',
}

// ─── Tiers ──────────────────────────────────────────────────────────────────────

export const TIER_1_RANKS = ['Socio', 'Ejecutivo', 'Bronce', 'Plata'] as const
export const TIER_2_RANKS = ['Oro', 'Platino', 'Diamante'] as const
export const TIER_3_RANKS = [
  'Doble Diamante',
  'Triple Diamante',
  'Diamante Embajador',
  'Doble Diamante Embajador',
  'Triple Diamante Embajador',
] as const

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Returns the next rank in progression, or null if at max rank. */
export function getNextRank(current: string): string | null {
  const idx = RANK_ORDER.indexOf(current)
  if (idx === -1 || idx === RANK_ORDER.length - 1) return null
  return RANK_ORDER[idx + 1]
}

/** Returns the tier (1|2|3) for a given rank. Defaults to Tier 1. */
export function getTier(rank: string | null | undefined): 1 | 2 | 3 {
  if (!rank) return 1
  if ((TIER_1_RANKS as readonly string[]).includes(rank)) return 1
  if ((TIER_2_RANKS as readonly string[]).includes(rank)) return 2
  if ((TIER_3_RANKS as readonly string[]).includes(rank)) return 3
  return 1
}
