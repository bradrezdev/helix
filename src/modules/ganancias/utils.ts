// ─── Ganancias Utils ──────────────────────────────────────────────────────────
// Aggregation logic for commission data grouped by bono_type.

import type { Commission } from '../../hooks/useCommissions'

export interface BonoGroup {
  key: string        // bono_type identifier
  total: number      // sum of all amounts for this bonus type
  count: number      // number of commission transactions
  percentage: number // percentage of grand total (0–100)
}

/**
 * Groups commissions by bono_type and computes total, count, and percentage.
 * Sorted descending by total.
 */
export function aggregateByGroup(commissions: Commission[]): BonoGroup[] {
  const map = new Map<string, { total: number; count: number }>()

  for (const c of commissions) {
    const existing = map.get(c.bono_type)
    if (existing) {
      existing.total += c.amount
      existing.count += 1
    } else {
      map.set(c.bono_type, { total: c.amount, count: 1 })
    }
  }

  const grandTotal = [...map.values()].reduce((sum, g) => sum + g.total, 0)

  return [...map.entries()]
    .map(([key, { total, count }]) => ({
      key,
      total,
      count,
      percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
}
