import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface NetworkOrder {
  id: string
  order_code: string
  buyer_user_id: number
  buyer_name: string
  buyer_apellidos: string | null
  tree_level: number
  pv: number
  cv: number
  total_amount: number
  status: string
  created_at: string
}

interface NetworkPedidosResult {
  orders: NetworkOrder[]
  total: number
}

interface UseNetworkPedidosParams {
  userId: string | undefined
  page?: number
  pageSize?: number
  status?: string | null
  dateFrom?: string | null
  dateTo?: string | null
}

export function useNetworkPedidos({
  userId,
  page = 1,
  pageSize = 20,
  status,
  dateFrom,
  dateTo,
}: UseNetworkPedidosParams) {
  return useQuery({
    queryKey: ['network-orders', userId, page, status, dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_network_orders', {
        p_root_id: userId ?? null,
        p_page: page,
        p_page_size: pageSize,
        p_status: status ?? null,
        p_date_from: dateFrom ?? null,
        p_date_to: dateTo ?? null,
      })
      if (error) throw error
      const orders = (data ?? []) as NetworkOrder[]
      const total = orders.length > 0 ? (orders[0] as unknown as { total_count: number }).total_count : 0
      return { orders, total } as NetworkPedidosResult
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 min (orders change more often)
  })
}
