import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// ─── Network Stats ─────────────────────────────────────────────────────────────

export interface NetworkStats {
  active_count: number
  rank_distribution: unknown
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
