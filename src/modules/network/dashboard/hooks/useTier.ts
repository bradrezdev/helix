// ─── Tier Detection ──────────────────────────────────────────────────────────
// Maps rank → tier (1|2|3). Tier 1 = entry-level, Tier 3 = top leaders.
// Defaults to Tier 1 for null, empty, or unrecognized ranks.

export const TIER_1_RANKS = ['Socio', 'Ejecutivo', 'Bronce', 'Plata'] as const
export const TIER_2_RANKS = ['Oro', 'Platino', 'Diamante'] as const
// Tier 3: Doble Diamante, Triple Diamante, Diamante Embajador,
//         Doble Diamante Embajador, Triple Diamante Embajador
// (everything not in Tier 1 or Tier 2 defaults to Tier 3 when rank is known)

export type Tier = 1 | 2 | 3

export function getTier(rank: string | null | undefined): Tier {
  if (!rank) return 1
  if ((TIER_1_RANKS as readonly string[]).includes(rank)) return 1
  if ((TIER_2_RANKS as readonly string[]).includes(rank)) return 2
  // Known Tier 3 ranks — anything else also falls through to 1 as safety
  const TIER_3_RANKS = [
    'Doble Diamante',
    'Triple Diamante',
    'Diamante Embajador',
    'Doble Diamante Embajador',
    'Triple Diamante Embajador',
  ] as const
  if ((TIER_3_RANKS as readonly string[]).includes(rank)) return 3
  // Unrecognized rank → Tier 1 (safe default)
  return 1
}
