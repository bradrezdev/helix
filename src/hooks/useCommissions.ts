import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface Commission {
  id: string
  bono_type: string
  amount: number
  period_month: number
  period_year: number
  level: number | null
  calculated_at: string
  source_user_id: string | null
}

export function useCommissions(userId: string, month: number, year: number) {
  return useQuery({
    queryKey: ['commissions', userId, month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select('id, bono_type, amount, period_month, period_year, level, calculated_at, source_user_id')
        .eq('user_id', userId)
        .eq('period_month', month)
        .eq('period_year', year)
        .order('calculated_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Commission[]
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
