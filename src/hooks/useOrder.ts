import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

export type OrderItem = Tables<'order_items'>
export type CediDetail = Tables<'cedis'>
export type DireccionDetail = Tables<'direcciones'>

// Extend orders with optional fields not yet in DB types
export type OrderRow = Tables<'orders'> & {
  payment_method?: string | null
  shipping_data?: Record<string, unknown> | null
}

export type OrderWithItems = OrderRow & { order_items: OrderItem[] }

export type ShippingDetail =
  | { type: 'cedi'; data: CediDetail }
  | { type: 'domicilio'; data: DireccionDetail }
  | { type: 'none' }

interface UseOrderResult {
  order: OrderWithItems | null
  shippingDetail: ShippingDetail
  loading: boolean
  error: string | null
}

async function fetchOrder(orderId: string): Promise<UseOrderResult> {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single()

  if (orderError) throw orderError
  const order = orderData as unknown as OrderWithItems

  const shipping = order.shipping_data as Record<string, unknown> | null

  let shippingDetail: ShippingDetail = { type: 'none' }

  if (shipping?.type === 'cedi' && shipping.cedi_id) {
    const { data: cediData } = await supabase
      .from('cedis')
      .select('*')
      .eq('id', String(shipping.cedi_id))
      .single()
    if (cediData) shippingDetail = { type: 'cedi', data: cediData as CediDetail }
  } else if (shipping?.type === 'domicilio' && shipping.direccion_id) {
    const { data: dirData } = await supabase
      .from('direcciones')
      .select('*')
      .eq('id', String(shipping.direccion_id))
      .single()
    if (dirData) shippingDetail = { type: 'domicilio', data: dirData as DireccionDetail }
  }

  return { order, shippingDetail, loading: false, error: null }
}

export function useOrder(orderId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 2,
  })

  return {
    order: data?.order ?? null,
    shippingDetail: data?.shippingDetail ?? { type: 'none' as const },
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
