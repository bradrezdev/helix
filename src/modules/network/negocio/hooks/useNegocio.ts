import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'
import { useCommissions } from '../../../finances/comisiones/hooks/useCommissions.ts'

// ─── Leg Volumes ───────────────────────────────────────────────────────────────

export interface LegVolume {
  direct_id: string
  direct_name: string
  leg_volume: number
}

export function useLegVolumes(userId: string) {
  return useQuery({
    queryKey: ['leg-volumes', userId],
    queryFn: async (): Promise<LegVolume[]> => {
      const { data, error } = await supabase.rpc('get_leg_volumes', { p_user_id: userId })
      if (error) throw error
      return (data ?? []) as LegVolume[]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Rank Distribution ─────────────────────────────────────────────────────────

export interface RankDistribution {
  [rank: string]: number  // e.g. { "Bronce": 12, "Plata": 4, "Oro": 1 }
}

// ─── Network Stats ─────────────────────────────────────────────────────────────

export interface NetworkStats {
  active_count: number
  rank_distribution: RankDistribution | null
  sponsor_directs: number
  sponsor_total: number
  unilevel_directs: number
  unilevel_total: number
}

export function useNetworkStats(userId: string) {
  return useQuery({
    queryKey: ['network-stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_network_stats', { p_user_id: userId })
      if (error) throw error
      return (data?.[0] ?? null) as NetworkStats | null
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Recent Registrations ──────────────────────────────────────────────────────

export interface RecentUser {
  id: string
  name: string
  created_at: string | null
  rank: string | null
  sponsor_id: string | null
}

export function useRecentUsers(limit = 10) {
  return useQuery({
    queryKey: ['recent-users', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, created_at, rank, sponsor_id')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as RecentUser[]
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Commission History ────────────────────────────────────────────────────────

export type CommissionStatus = 'pagado' | 'pendiente' | 'procesando'

export interface CommissionRow {
  id: string
  bono_type: string
  amount: number
  calculated_at: string | null
  paid_at: string | null
  period_month: number
  period_year: number
  status: CommissionStatus
}

function deriveStatus(paid_at: string | null, calculated_at: string | null): CommissionStatus {
  if (paid_at) return 'pagado'
  if (calculated_at) return 'procesando'
  return 'pendiente'
}

export function useCommissionHistory(userId: string, limit = 20) {
  return useQuery({
    queryKey: ['commission-history', userId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select('id, bono_type, amount, calculated_at, paid_at, period_month, period_year')
        .eq('user_id', userId)
        .order('calculated_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []).map((row) => ({
        ...row,
        status: deriveStatus(row.paid_at, row.calculated_at),
      })) as CommissionRow[]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Commission Breakdown ──────────────────────────────────────────────────────

export interface BreakdownItem {
  bono_type: string
  total: number    // sum of amount for the period
  count: number    // number of commission rows
}

/**
 * Derives a breakdown of commissions by bono_type for a given month/year.
 * Aggregates client-side from useCommissions — no extra DB query.
 * Only executes when enabled (tier ≥ 2).
 */
export function useCommissionBreakdown(
  userId: string,
  month: number,
  year: number,
  enabled = true,
): { data: BreakdownItem[]; isLoading: boolean } {
  const query = useCommissions(userId, month, year)

  const data = useMemo<BreakdownItem[]>(() => {
    if (!query.data) return []
    const map = new Map<string, BreakdownItem>()
    for (const row of query.data) {
      const existing = map.get(row.bono_type)
      if (existing) {
        existing.total += row.amount
        existing.count += 1
      } else {
        map.set(row.bono_type, { bono_type: row.bono_type, total: row.amount, count: 1 })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [query.data])

  // Respect the enabled flag — return empty while disabled
  if (!enabled) return { data: [], isLoading: false }
  return { data, isLoading: query.isLoading }
}

// ─── VG Trend ─────────────────────────────────────────────────────────────────

export interface VgTrendPoint {
  month: number
  year: number
  label: string   // e.g. "Abr 2026"
  total: number   // sum(amount) for that period
}

const MONTH_LABELS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

function buildMonthLabel(month: number, year: number): string {
  return `${MONTH_LABELS_ES[month - 1] ?? month} ${year}`
}

/**
 * Fetches commissions over a rolling window and groups by period (month/year).
 * Used for the VG trend chart (Tier 3). staleTime ≥ 60_000ms per spec REQ-7.
 * Only executes when enabled (tier = 3).
 */
export function useVgTrend(
  userId: string,
  months = 6,
  enabled = true,
): { data: VgTrendPoint[]; isLoading: boolean } {
  return useQuery({
    queryKey: ['vg-trend', userId, months],
    queryFn: async (): Promise<VgTrendPoint[]> => {
      const { data, error } = await supabase
        .from('commissions')
        .select('period_month, period_year, amount')
        .eq('user_id', userId)
        .order('period_year', { ascending: true })
        .order('period_month', { ascending: true })
      if (error) throw error

      // Group by period client-side
      const map = new Map<string, { month: number; year: number; total: number }>()
      for (const row of data ?? []) {
        const key = `${row.period_year}-${row.period_month}`
        const existing = map.get(key)
        if (existing) {
          existing.total += row.amount as number
        } else {
          map.set(key, { month: row.period_month as number, year: row.period_year as number, total: row.amount as number })
        }
      }

      // Sort and take last `months` entries
      const sorted = Array.from(map.values()).sort((a, b) =>
        a.year !== b.year ? a.year - b.year : a.month - b.month,
      )
      const windowed = sorted.slice(-months)
      return windowed.map((p) => ({
        ...p,
        label: buildMonthLabel(p.month, p.year),
      }))
    },
    enabled: !!userId && enabled,
    staleTime: 60_000,
  })
}
