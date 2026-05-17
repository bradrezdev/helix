// ─── useComisionesNivelSocios ─────────────────────────────────────────────────
// Hook for get_comisiones_nivel_socios RPC — returns individual commissions
// for a given level, with originator name, PV, CV, %, and ganancia.
//
// p_periodo format: 'YYYY-M' (e.g. '2026-5') or 'todos' for all periods.

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'

export interface ComisionNivelSocio {
  socio_name: string        // "Nombre Apellidos" (trimmed)
  socio_apellidos: string   // apellidos only
  socio_user_id: number     // source user's bigint ID
  bono_type: string         // e.g. 'patrocinio', 'unilevel'
  pv: number                // order PV
  cv: number                // order CV
  percentage: number | null // calculated % (null for non-tiered bonos)
  ganancia: number          // commission amount
  currency: string          // 'MXN', 'USD', etc.
  source_order_code: string // human-readable order ID
  calculated_at: string     // ISO timestamp when commission was calculated
}

export interface UseComisionesNivelSociosParams {
  userId: string | undefined
  nivel: number | null     // null = disabled (lazy-load)
  periodo: string          // '2026-5' or 'todos'
}

export function useComisionesNivelSocios({
  userId,
  nivel,
  periodo,
}: UseComisionesNivelSociosParams) {
  return useQuery({
    queryKey: ['comisiones-nivel-socios', userId, nivel, periodo],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_comisiones_nivel_socios', {
        p_user_id: userId ?? null,
        p_nivel: nivel!,
        p_periodo: periodo ?? 'todos',
      })
      if (error) throw error
      return (data ?? []) as ComisionNivelSocio[]
    },
    enabled: !!userId && nivel !== null,
    staleTime: 5 * 60 * 1000,
  })
}
