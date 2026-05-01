import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface ComisionNivel {
  level: number
  total_socios: number
  total_pv: number
  total_cv: number
  total_amount: number
}

export interface UseComisionesNivelParams {
  userId: string | undefined
  month?: number | null    // 1-12, null = all months
  year?: number | null     // e.g. 2026, null = all years
}

export function useComisionesNivel({ userId, month, year }: UseComisionesNivelParams) {
  return useQuery({
    queryKey: ['comisiones-nivel', userId, month, year],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_comisiones_nivel_all', {
        p_user_id: userId ?? null,
        p_month: month ?? null,
        p_year: year ?? null,
      })
      if (error) throw error
      return (data ?? []) as ComisionNivel[]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
