import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'

export interface VolumeRow {
  user_id: string
  user_name: string
  level: number
  starter_kit_cv: number
  starter_kit_pv: number
  recompra_cv: number
  recompra_pv: number
}

export function useVolumeAudit(month: number, year: number) {
  return useQuery({
    queryKey: ['volume-audit', month, year],
    queryFn: async () => {
      const { data } = await supabase.rpc('map_reduce_volume', {
        p_month: month,
        p_year: year,
      })
      return (data ?? []) as VolumeRow[]
    },
    staleTime: 30 * 60 * 1000,
  })
}
