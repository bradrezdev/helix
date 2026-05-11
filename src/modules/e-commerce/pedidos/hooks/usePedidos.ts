import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'
import type { Tables } from '../../../../lib/database.types.ts'

export type OrderItem = Tables<'order_items'>

export type OrderWithItems = Tables<'orders'> & {
  order_items: OrderItem[]
  // Extended runtime fields not yet reflected in generated DB types
  payment_method?: string | null
  shipping_data?: Record<string, unknown> | null
  updated_at?: string | null
  cedi_name?: string | null
}

export interface PedidosFilter {
  status?: string
  paymentMethod?: string
  shippingType?: string
  dateFrom?: string
  dateTo?: string
  sortDir?: 'asc' | 'desc'
}

async function fetchPedidos(
  userId: string,
  filter?: PedidosFilter,
  isAdmin?: boolean,
): Promise<OrderWithItems[]> {
  const ascending = filter?.sortDir === 'asc'

  let query = supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending })

  // Admin sees all orders; regular users see only their own
  if (!isAdmin) {
    query = query.eq('user_id', userId)
  }

  if (filter?.status) {
    query = query.eq('status', filter.status)
  }

  if (filter?.paymentMethod) {
    query = query.eq('payment_method', filter.paymentMethod)
  }

  if (filter?.dateFrom) {
    query = query.gte('created_at', filter.dateFrom)
  }

  if (filter?.dateTo) {
    query = query.lte('created_at', filter.dateTo + 'T23:59:59.999Z')
  }

  const { data, error } = await query

  if (error) throw error

  const rows = (data ?? []) as unknown as OrderWithItems[]

  // Apply shippingType filter client-side (shipping_data is JSONB)
  let filtered = rows
  if (filter?.shippingType) {
    const shippingType = filter.shippingType
    filtered = rows.filter((row) => {
      const shipping = row.shipping_data as Record<string, unknown> | null
      return shipping?.type === shippingType
    })
  }

  // Collect unique cedi IDs for batch name resolution
  const cediIds = new Set<string>()
  for (const row of filtered) {
    const shipping = row.shipping_data as Record<string, unknown> | null
    if (shipping?.type === 'cedi' && shipping.cedi_id) {
      cediIds.add(String(shipping.cedi_id))
    }
  }

  // Batch fetch cedi names
  const cediNameMap = new Map<string, string>()
  if (cediIds.size > 0) {
    const { data: cediData } = await supabase
      .from('cedis')
      .select('id, nombre')
      .in('id', Array.from(cediIds))

    if (cediData) {
      for (const c of cediData) {
        cediNameMap.set(String(c.id), c.nombre ?? '')
      }
    }
  }

  // Attach cedi_name to each row
  return filtered.map((row) => {
    const shipping = row.shipping_data as Record<string, unknown> | null
    const cediName =
      shipping?.type === 'cedi' && shipping.cedi_id
        ? (cediNameMap.get(String(shipping.cedi_id)) ?? null)
        : null
    return { ...row, cedi_name: cediName }
  })
}

export function usePedidos(userId: string, filter?: PedidosFilter, isAdmin?: boolean) {
  return useQuery({
    queryKey: ['pedidos', userId, filter, isAdmin],
    queryFn: () => fetchPedidos(userId, filter, isAdmin),
    staleTime: 1000 * 60 * 2,
    enabled: !!userId,
  })
}
