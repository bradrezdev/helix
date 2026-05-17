// ─── useComisionesDetalle ────────────────────────────────────────────────────
// Hook for get_comisiones_detalle RPC — full commission detail for a specific
// bono_type, with order and user info joined server-side.
//
// Used by BonoDetail page (/ganancias/$bonoType).

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'

export interface ComisionDetalle {
  commission_id: string       // uuid
  bono_type: string           // e.g. 'patrocinio'
  level: number               // commission level
  amount: number              // commission amount
  currency: string            // 'MXN', 'USD', etc.
  source_user_id: number      // originator's bigint ID
  source_name: string         // "Nombre Apellidos" (trimmed)
  source_order_id: string     // order uuid
  source_order_code: string   // human-readable order ID
  pv: number                  // order PV
  cv: number                  // order CV
  percentage: number | null   // calculated % (null for non-tiered)
  calculated_at: string       // ISO timestamp
}

export interface UseComisionesDetalleParams {
  userId: string | undefined
  bonoType: string | undefined
  month?: number | null
  year?: number | null
}

export function useComisionesDetalle({
  userId,
  bonoType,
  month,
  year,
}: UseComisionesDetalleParams) {
  return useQuery({
    queryKey: ['comisiones-detalle', userId, bonoType, month, year],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_comisiones_detalle', {
        p_user_id: userId ?? null,
        p_bono_type: bonoType ?? null,
        p_month: month ?? null,
        p_year: year ?? null,
      })
      if (error) throw error
      return (data ?? []) as ComisionDetalle[]
    },
    enabled: !!userId && !!bonoType,
    staleTime: 5 * 60 * 1000,
  })
}
