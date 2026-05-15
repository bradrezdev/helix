// ─── Ganancias Utils ──────────────────────────────────────────────────────────
// Aggregation logic for commission data grouped by bono_type.

import type { Commission } from '../comisiones/hooks/useCommissions.ts'

export interface BonoGroup {
  key: string        // bono_type identifier
  total: number      // sum of all amounts for this bonus type
  count: number      // number of commission transactions
  percentage: number // percentage of grand total (0–100)
  currency: string   // currency code from commissions
}

/**
 * Groups commissions by bono_type and computes total, count, and percentage.
 * Sorted descending by total.
 */
export function aggregateByGroup(commissions: Commission[]): BonoGroup[] {
  const map = new Map<string, { total: number; count: number; currency: string }>()

  for (const c of commissions) {
    const existing = map.get(c.bono_type)
    if (existing) {
      existing.total += c.amount
      existing.count += 1
    } else {
      map.set(c.bono_type, { total: c.amount, count: 1, currency: c.currency })
    }
  }

  const grandTotal = [...map.values()].reduce((sum, g) => sum + g.total, 0)

  return [...map.entries()]
    .map(([key, { total, count, currency }]) => ({
      key,
      total,
      count,
      currency,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}
