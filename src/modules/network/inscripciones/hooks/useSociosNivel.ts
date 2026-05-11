import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'

// ─── SocioNivel (drill-down per level) ─────────────────────────────────────────

export interface SocioNivel {
  source_user_id: string
  user_id: number
  name: string
  apellidos: string | null
  pv: number
  cv: number
  amount: number
}

// ─── Params ────────────────────────────────────────────────────────────────────

export interface UseSociosNivelParams {
  userId: string | undefined
  level: number | null // null = disabled (lazy-load on level selection)
  month?: number | null
  year?: number | null
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useSociosNivel({ userId, level, month, year }: UseSociosNivelParams) {
  return useQuery({
    queryKey: ['socios-nivel', userId, level, month, year],
    queryFn: async (): Promise<SocioNivel[]> => {
      const { data, error } = await supabase.rpc('get_socios_nivel_all', {
        p_user_id: userId ?? null,
        p_level: level!,
        p_month: month ?? null,
        p_year: year ?? null,
      })
      if (error) throw error
      return (data ?? []) as SocioNivel[]
    },
    enabled: !!userId && level !== null,
    staleTime: 5 * 60 * 1000,
  })
}
