import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'

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
      const rows = (data ?? []) as Array<Record<string, unknown>>
      const orders: NetworkOrder[] = rows.map((row) => ({
        id: row.order_id as string,
        order_code: row.order_id as string,
        buyer_user_id: row.buyer_user_id as number,
        buyer_name: row.buyer_name as string,
        buyer_apellidos: row.buyer_apellidos as string | null,
        tree_level: row.tree_level as number,
        pv: row.total_pv as number,
        cv: row.total_cv as number,
        total_amount: row.total_amount as number,
        status: row.status as string,
        created_at: row.created_at as string,
      }))
      const total = rows.length > 0 ? (rows[0].total_count as number) : 0
      return { orders, total }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 min (orders change more often)
  })
}
