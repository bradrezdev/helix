import { supabase } from '../lib/supabase'

export interface DashboardData {
  rank: string
  group_vg: number
  personal_pv: number
  personal_cv: number
  total_commissions_month: number
  active_directs: number
  fidelity_points: number
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  const { data, error } = await supabase.rpc('get_user_dashboard', {
    p_user_id: userId,
  } as never)

  if (error) {
    throw new Error(`Error fetching dashboard: ${error.message}`)
  }

  if (!data) {
    throw new Error('No dashboard data returned')
  }

  // RPC returns array of objects: [{ get_user_dashboard: "<JSON string>" }]
  const raw = Array.isArray(data) ? (data as Record<string, unknown>[])[0] : (data as Record<string, unknown>)
  // Unwrap: may be a JSON string or already an object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let nested: any = raw?.get_user_dashboard ?? raw
  if (typeof nested === 'string') nested = JSON.parse(nested)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row: any = nested

  return {
    rank: row.current_rank ?? row.profile?.rank ?? '',
    group_vg: row.month_vg ?? row.profile?.group_vg ?? 0,
    personal_pv: row.month_pv ?? row.profile?.personal_pv ?? 0,
    personal_cv: row.profile?.personal_cv ?? 0,
    total_commissions_month: row.total_commissions_month ?? 0,
    active_directs: row.active_directs ?? row.profile?.active_directs ?? 0,
    fidelity_points: row.fidelity_points ?? row.profile?.fidelity_points ?? 0,
  } as DashboardData
}
