import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'

export interface PeriodoVolumen {
  period_id: string
  period_name: string
  period_month: number
  period_year: number
  start_date: string
  end_date: string
  status: 'active' | 'closed'
  personal_pv: number
  personal_cv: number
  group_vg: number
}

export function usePeriodos(userId: string | undefined) {
  return useQuery({
    queryKey: ['periodos-volumen', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_periodos_volumen', {
        p_user_id: userId ?? null,
      })
      if (error) throw error
      return (data ?? []) as PeriodoVolumen[]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
