// ─── useDashboardTops ─────────────────────────────────────────────────────────
// Hooks para los nuevos widgets: TOP Rangos, TOP Consumidores, TOP Reclutadores,
// Primera vs Recompra, y Ganancias (comisiones) por período.

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'
import { MONTH_LABELS_ES } from '../../../../lib/calendar.ts'

// ─── Rank ordering ─────────────────────────────────────────────────────────────

export const RANK_ORDER = [
  'Socio', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante',
  'Doble Diamante', 'Triple Diamante', 'Diamante Embajador',
  'Doble Diamante Embajador', 'Triple Diamante Embajador',
]

// ─── TOP Rangos ────────────────────────────────────────────────────────────────

export interface TopRankUser {
  id: string
  name: string
  rank: string | null
  personal_pv: number | null
}

export function useTopRankos(
  userId: string,
  userNumId: number,
  _month: number,
  _year: number,
  isAdmin: boolean,
) {
  return useQuery({
    queryKey: ['top-rankos', userId, userNumId, isAdmin],
    queryFn: async (): Promise<TopRankUser[]> => {
      let query = supabase
        .from('users')
        .select('id, name, rank, personal_pv')
        .not('rank', 'is', null)

      if (!isAdmin) {
        // Split mixed-type .or() — sponsor_id is BIGINT, unilevel_parent_id is UUID
        const [directsResult, unilevelResult] = await Promise.all([
          supabase.from('users').select('id, name, rank, personal_pv').eq('sponsor_id', userNumId).not('rank', 'is', null).limit(50),
          supabase.from('users').select('id, name, rank, personal_pv').eq('unilevel_parent_id', userId).not('rank', 'is', null).limit(50),
        ])
        const merged = [...(directsResult.data || []), ...(unilevelResult.data || [])]
        const deduped = Array.from(new Map(merged.map((u: TopRankUser) => [u.id, u])).values())
        const rows = deduped
          .sort((a, b) => {
            const ai = RANK_ORDER.indexOf(a.rank ?? '')
            const bi = RANK_ORDER.indexOf(b.rank ?? '')
            if (bi !== ai) return bi - ai
            return (b.personal_pv ?? 0) - (a.personal_pv ?? 0)
          })
          .slice(0, 10)
        return rows as TopRankUser[]
      }

      const { data, error } = await query.limit(50)
      if (error) throw error

      const rows = (data ?? []) as TopRankUser[]

      // Sort by rank enum order DESC then by personal_pv DESC
      return rows
        .sort((a, b) => {
          const ai = RANK_ORDER.indexOf(a.rank ?? '')
          const bi = RANK_ORDER.indexOf(b.rank ?? '')
          if (bi !== ai) return bi - ai
          return (b.personal_pv ?? 0) - (a.personal_pv ?? 0)
        })
        .slice(0, 10)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── TOP Consumidores ──────────────────────────────────────────────────────────

export interface TopConsumer {
  user_id: string
  name: string
  rank: string | null
  total_pv: number
}

export function useTopConsumers(
  userId: string,
  userNumId: number,
  month: number,
  year: number,
  isAdmin: boolean,
) {
  return useQuery({
    queryKey: ['top-consumers', userId, userNumId, month, year, isAdmin],
    queryFn: async (): Promise<TopConsumer[]> => {
      // Fetch orders for the period with order_items and user info
      let ordersQuery = supabase
        .from('orders')
        .select('id, user_id')
        .eq('status', 'paid')

      // Filter by month/year — use date range
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`

      ordersQuery = ordersQuery.gte('created_at', startDate).lt('created_at', endDate)

      const { data: ordersData, error: ordersError } = await ordersQuery
      if (ordersError) throw ordersError

      if (!ordersData || ordersData.length === 0) return []

      const orderIds = ordersData.map((o) => o.id as string)
      const orderUserMap = new Map<string, string>((ordersData as { id: string; user_id: string }[]).map((o) => [o.id, o.user_id]))

      // Fetch order items PV
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, pv, quantity')
        .in('order_id', orderIds)
      if (itemsError) throw itemsError

      // Aggregate PV per user
      const pvByUserId = new Map<string, number>()
      for (const item of itemsData ?? []) {
        const uid = orderUserMap.get(item.order_id as string)
        if (!uid) continue
        const pv = ((item.pv as number) ?? 0) * ((item.quantity as number) ?? 1)
        pvByUserId.set(uid, (pvByUserId.get(uid) ?? 0) + pv)
      }

      if (pvByUserId.size === 0) return []

      // Fetch user info for matching users
      const userIds = Array.from(pvByUserId.keys())

      let usersData: { id: string; name: string; rank: string | null }[] = []

      if (!isAdmin) {
        // Split mixed-type .or() — sponsor_id is BIGINT, id is UUID
        const [directsResult, selfResult] = await Promise.all([
          supabase.from('users').select('id, name, rank').in('id', userIds).eq('sponsor_id', userNumId),
          supabase.from('users').select('id, name, rank').in('id', userIds).eq('id', userId),
        ])
        const merged = [...(directsResult.data || []), ...(selfResult.data || [])]
        usersData = Array.from(new Map(merged.map((u) => [u.id, u])).values()) as { id: string; name: string; rank: string | null }[]
      } else {
        const { data, error: usersError } = await supabase
          .from('users')
          .select('id, name, rank')
          .in('id', userIds)
        if (usersError) throw usersError
        usersData = (data ?? []) as { id: string; name: string; rank: string | null }[]
      }

      return usersData

      return ((usersData ?? []) as { id: string; name: string; rank: string | null }[])
        .map((u) => ({
          user_id: u.id,
          name: u.name,
          rank: u.rank,
          total_pv: pvByUserId.get(u.id) ?? 0,
        }))
        .sort((a, b) => b.total_pv - a.total_pv)
        .slice(0, 10)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── TOP Reclutadores ─────────────────────────────────────────────────────────

export interface TopRecruiter {
  id: string
  name: string
  rank: string | null
  recruited_count: number
}

export function useTopRecruiters(
  userId: string,
  userNumId: number,
  month: number,
  year: number,
  isAdmin: boolean,
) {
  return useQuery({
    queryKey: ['top-recruiters', userId, userNumId, month, year, isAdmin],
    queryFn: async (): Promise<TopRecruiter[]> => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`

      // Fetch newly created users in period
      let newUsersQuery = supabase
        .from('users')
        .select('id, sponsor_id')
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .not('sponsor_id', 'is', null)

      const { data: newUsers, error: newUsersError } = await newUsersQuery
      if (newUsersError) throw newUsersError

      if (!newUsers || newUsers.length === 0) return []

      // Count recruits per sponsor (sponsor_id is BIGINT/number)
      const countBySponsor = new Map<number, number>()
      for (const u of newUsers as { id: string; sponsor_id: number }[]) {
        countBySponsor.set(u.sponsor_id, (countBySponsor.get(u.sponsor_id) ?? 0) + 1)
      }

      const sponsorIds = Array.from(countBySponsor.keys())

      let sponsorsData: { id: string; user_id: number; name: string; rank: string | null }[] = []

      if (!isAdmin) {
        // Split mixed-type .or() — id is UUID, sponsor_id is BIGINT
        const [selfResult, directsResult] = await Promise.all([
          supabase.from('users').select('id, user_id, name, rank').in('user_id', sponsorIds).eq('id', userId),
          supabase.from('users').select('id, user_id, name, rank').in('user_id', sponsorIds).eq('sponsor_id', userNumId),
        ])
        const merged = [...(selfResult.data || []), ...(directsResult.data || [])]
        sponsorsData = Array.from(new Map(merged.map((u) => [u.id, u])).values()) as { id: string; user_id: number; name: string; rank: string | null }[]
      } else {
        const { data, error: sponsorsError } = await supabase
          .from('users')
          .select('id, user_id, name, rank')
          .in('user_id', sponsorIds)
        if (sponsorsError) throw sponsorsError
        sponsorsData = (data ?? []) as { id: string; user_id: number; name: string; rank: string | null }[]
      }

      return ((sponsorsData ?? []) as { id: string; user_id: number; name: string; rank: string | null }[])
        .map((u) => ({
          id: u.id,
          name: u.name,
          rank: u.rank,
          recruited_count: countBySponsor.get(u.user_id) ?? 0,
        }))
        .sort((a, b) => b.recruited_count - a.recruited_count)
        .slice(0, 10)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Primera vs Recompra ───────────────────────────────────────────────────────

export interface DayPoint {
  day: number
  count: number
}

export interface MonthPoint {
  month: number
  year: number
  label: string
  count: number
}

export interface FirstVsRepurchaseData {
  firstPurchases: DayPoint[]
  repurchases: DayPoint[]
  annualFirstPurchases: MonthPoint[]
  annualRepurchases: MonthPoint[]
}

export function useFirstVsRepurchase(
  userId: string,
  month: number,
  year: number,
  isAdmin: boolean,
) {
  return useQuery({
    queryKey: ['first-vs-repurchase', userId, month, year, isAdmin],
    queryFn: async (): Promise<FirstVsRepurchaseData> => {
      // Fetch all paid orders for the user's org
      let query = supabase
        .from('orders')
        .select('id, user_id, created_at')
        .eq('status', 'paid')

      if (!isAdmin) {
        query = query.or(`user_id.eq.${userId}`)
      }

      const { data: allOrders, error } = await query
      if (error) throw error

      const orders = (allOrders ?? []) as { id: string; user_id: string; created_at: string }[]

      // Count orders per user (for first vs repurchase detection)
      const orderCountByUser = new Map<string, number>()
      for (const o of orders) {
        orderCountByUser.set(o.user_id, (orderCountByUser.get(o.user_id) ?? 0) + 1)
      }

      // Monthly view: current month orders by day
      const firstPurchasesByDay = new Map<number, number>()
      const repurchasesByDay = new Map<number, number>()

      // Annual view: by month of current year
      const firstByMonth = new Map<string, number>()
      const repurchaseByMonth = new Map<string, number>()

      // Determine order sequence per user for classification
      // Sort all orders by user and date
      const ordersByUser = new Map<string, string[]>()
      for (const o of orders) {
        const existing = ordersByUser.get(o.user_id) ?? []
        existing.push(o.created_at)
        ordersByUser.set(o.user_id, existing)
      }
      // Sort each user's orders chronologically
      for (const [uid, dates] of ordersByUser) {
        ordersByUser.set(uid, dates.sort())
      }

      for (const o of orders) {
        const date = new Date(o.created_at)
        const oMonth = date.getMonth() + 1
        const oYear = date.getFullYear()
        const oDay = date.getDate()

        const userOrders = ordersByUser.get(o.user_id) ?? []
        const isFirst = userOrders[0] === o.created_at

        // Monthly breakdown (only current month/year)
        if (oMonth === month && oYear === year) {
          if (isFirst) {
            firstPurchasesByDay.set(oDay, (firstPurchasesByDay.get(oDay) ?? 0) + 1)
          } else {
            repurchasesByDay.set(oDay, (repurchasesByDay.get(oDay) ?? 0) + 1)
          }
        }

        // Annual breakdown (current year)
        if (oYear === year) {
          const key = `${oYear}-${oMonth}`
          if (isFirst) {
            firstByMonth.set(key, (firstByMonth.get(key) ?? 0) + 1)
          } else {
            repurchaseByMonth.set(key, (repurchaseByMonth.get(key) ?? 0) + 1)
          }
        }
      }

      // Build day arrays (all days in month)
      const firstPurchases: DayPoint[] = []
      const repurchases: DayPoint[] = []
      // We'll return all days that have data — the widget handles the full axis
      const allDays = new Set([...firstPurchasesByDay.keys(), ...repurchasesByDay.keys()])
      for (const day of Array.from(allDays).sort((a, b) => a - b)) {
        firstPurchases.push({ day, count: firstPurchasesByDay.get(day) ?? 0 })
        repurchases.push({ day, count: repurchasesByDay.get(day) ?? 0 })
      }

      // Build month arrays (all 12 months)
      const annualFirstPurchases: MonthPoint[] = []
      const annualRepurchases: MonthPoint[] = []
      for (let m = 1; m <= 12; m++) {
        const key = `${year}-${m}`
        annualFirstPurchases.push({
          month: m, year,
          label: MONTH_LABELS_ES[m] ?? String(m),
          count: firstByMonth.get(key) ?? 0,
        })
        annualRepurchases.push({
          month: m, year,
          label: MONTH_LABELS_ES[m] ?? String(m),
          count: repurchaseByMonth.get(key) ?? 0,
        })
      }

      return { firstPurchases, repurchases, annualFirstPurchases, annualRepurchases }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Ganancias (Commissions) ───────────────────────────────────────────────────

export interface EarningsDayPoint {
  day: number
  amount: number
  currency: string
}

export interface EarningsMonthPoint {
  month: number
  year: number
  label: string
  amount: number
}

export interface EarningsData {
  daily: EarningsDayPoint[]
  monthly: EarningsMonthPoint[]
  totalForPeriod: number
}

export function useEarnings(
  userId: string,
  month: number,
  year: number,
  isAdmin: boolean,
) {
  return useQuery({
    queryKey: ['earnings', userId, month, year, isAdmin],
    queryFn: async (): Promise<EarningsData> => {
      let query = supabase
        .from('commissions')
        .select('user_id, amount, period_month, period_year, calculated_at')

      if (!isAdmin) {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query
      if (error) throw error

      const rows = (data ?? []) as {
        user_id: string
        amount: number
        period_month: number
        period_year: number
        calculated_at: string | null
      }[]

      // Daily (for selected month/year — use calculated_at date)
      const dailyMap = new Map<number, number>()
      for (const row of rows) {
        if (row.period_month === month && row.period_year === year && row.calculated_at) {
          const day = new Date(row.calculated_at).getDate()
          dailyMap.set(day, (dailyMap.get(day) ?? 0) + row.amount)
        }
      }

      const daily: EarningsDayPoint[] = Array.from(dailyMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([day, amount]) => ({ day, amount, currency: 'MXN' }))

      // Monthly (for selected year — all months)
      const monthlyMap = new Map<number, number>()
      for (const row of rows) {
        if (row.period_year === year) {
          monthlyMap.set(row.period_month, (monthlyMap.get(row.period_month) ?? 0) + row.amount)
        }
      }

      const monthly: EarningsMonthPoint[] = []
      for (let m = 1; m <= 12; m++) {
        monthly.push({
          month: m, year,
          label: MONTH_LABELS_ES[m] ?? String(m),
          amount: monthlyMap.get(m) ?? 0,
        })
      }

      // Total for selected period
      const totalForPeriod = rows
        .filter((r) => r.period_month === month && r.period_year === year)
        .reduce((sum, r) => sum + r.amount, 0)

      return { daily, monthly, totalForPeriod }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
