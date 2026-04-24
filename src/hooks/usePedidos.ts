import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

export type OrderItem = Tables<'order_items'>

export type OrderWithItems = Tables<'orders'> & {
  order_items: OrderItem[]
}

async function fetchPedidos(userId: string): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as OrderWithItems[]
}

export function usePedidos(userId: string) {
  return useQuery({
    queryKey: ['pedidos', userId],
    queryFn: () => fetchPedidos(userId),
    staleTime: 1000 * 60 * 2,
    enabled: !!userId,
  })
}
