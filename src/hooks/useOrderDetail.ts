import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { formatShippingMethod } from '../lib/formatters'
import type { ShippingData } from '../lib/formatters'

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface OrderDetailItem {
  id: string
  product_code: string
  product_name: string | null
  quantity: number
  unit_price: number
  total_amount: number
  pv: number
  cv: number
  cantidad: string | null // from products.cantidad
  is_kit: boolean // from products.is_kit
}

export interface OrderShipment {
  id: string
  guia_rastreo: string | null
  carrier: string | null
}

export interface OrderCommission {
  id: string
  user_id: string
  recipient_name: string // joined from users.name + users.apellidos
  bono_type: string
  amount: number
  level: number | null
  paid_at: string | null
  calculated_at: string
}

export interface FullOrderDetail {
  id: string
  order_id: string
  user_id: string
  status: string
  created_at: string
  updated_at: string | null
  paid_at: string | null
  payment_method: string | null
  shipping_data: unknown
  total_amount: number
  pv: number
  cv: number
  country: string | null
  price_type: string | null
  is_kit: boolean
  kit_type: string | null
}

export interface OrderDetailData {
  order: FullOrderDetail
  items: OrderDetailItem[]
  shipment: OrderShipment | null
  commissions: OrderCommission[]
  shippingLabel: string // pre-resolved label
  cediName: string | null
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchShipping(shippingData: ShippingData): Promise<{ label: string; cediName: string | null }> {
  if (!shippingData) {
    return { label: formatShippingMethod(null), cediName: null }
  }

  if (shippingData.type === 'cedi') {
    const { data, error } = await supabase
      .from('cedis')
      .select('name')
      .eq('id', shippingData.cedi_id)
      .single()

    if (error) {
      console.warn('[useOrderDetail] cedis fetch failed:', error.message)
      return { label: formatShippingMethod(shippingData), cediName: null }
    }

    const cediName = (data as { name: string } | null)?.name ?? null
    return { label: formatShippingMethod(shippingData, cediName ?? undefined), cediName }
  }

  if (shippingData.type === 'domicilio') {
    const { data, error } = await supabase
      .from('direcciones')
      .select('nombre_completo, calle_numero, colonia, municipio, estado, codigo_postal')
      .eq('id', shippingData.direccion_id)
      .single()

    if (error) {
      console.warn('[useOrderDetail] direcciones fetch failed:', error.message)
      return { label: 'Envío a domicilio', cediName: null }
    }

    if (!data) return { label: 'Envío a domicilio', cediName: null }

    const dir = data as {
      nombre_completo: string | null
      calle_numero: string | null
      colonia: string | null
      municipio: string | null
      estado: string | null
      codigo_postal: string | null
    }

    const parts = [
      dir.nombre_completo,
      dir.calle_numero,
      dir.colonia,
      dir.municipio,
      dir.estado,
      dir.codigo_postal,
    ].filter(Boolean)

    return { label: parts.join(', ') || 'Envío a domicilio', cediName: null }
  }

  return { label: formatShippingMethod(shippingData), cediName: null }
}

async function fetchProductsCantidad(
  productCodes: string[]
): Promise<Map<string, { cantidad: string | null; is_kit: boolean }>> {
  if (productCodes.length === 0) return new Map()

  const { data, error } = await supabase
    .from('products')
    .select('code, cantidad, is_kit')
    .in('code', productCodes)

  if (error) {
    console.warn('[useOrderDetail] products fetch failed:', error.message)
    return new Map()
  }

  const map = new Map<string, { cantidad: string | null; is_kit: boolean }>()
  for (const row of (data ?? []) as Array<{ code: string; cantidad: string | null; is_kit: boolean }>) {
    map.set(row.code, { cantidad: row.cantidad, is_kit: row.is_kit ?? false })
  }
  return map
}

async function fetchShipment(orderId: string): Promise<OrderShipment | null> {
  const { data, error } = await supabase
    .from('shipments')
    .select('id, guia_rastreo, carrier')
    .eq('order_id', orderId)
    .maybeSingle()

  if (error) {
    console.warn('[useOrderDetail] shipments fetch failed:', error.message)
    return null
  }

  return (data as OrderShipment | null) ?? null
}

async function fetchCommissions(orderId: string): Promise<OrderCommission[]> {
  const { data, error } = await supabase
    .from('commissions')
    .select('id, user_id, bono_type, amount, level, paid_at, calculated_at, users(name, apellidos)')
    .eq('source_order_id', orderId)

  if (error) {
    console.warn('[useOrderDetail] commissions fetch failed:', error.message)
    return []
  }

  return ((data ?? []) as Array<{
    id: string
    user_id: string
    bono_type: string
    amount: number
    level: number | null
    paid_at: string | null
    calculated_at: string
    users: { name: string | null; apellidos: string | null } | null
  }>).map((row) => {
    const name = row.users?.name ?? ''
    const apellidos = row.users?.apellidos ?? ''
    const recipient_name = [name, apellidos].filter(Boolean).join(' ').trim() || row.user_id

    return {
      id: row.id,
      user_id: row.user_id,
      recipient_name,
      bono_type: row.bono_type,
      amount: row.amount,
      level: row.level,
      paid_at: row.paid_at,
      calculated_at: row.calculated_at,
    }
  })
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

async function fetchOrderDetail(
  orderId: string,
  isAdmin: boolean
): Promise<OrderDetailData> {
  // Step 1: fetch order
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError) throw new Error(orderError.message)

  const raw = orderData as {
    id: string
    order_id: string
    user_id: string
    status: string
    created_at: string
    updated_at: string | null
    paid_at: string | null
    payment_method: string | null
    shipping_data: unknown
    total_amount: number
    pv: number
    cv: number
    country: string | null
    price_type: string | null
    is_kit: boolean
    kit_type: string | null
  }
  const order: FullOrderDetail = {
    id: raw.id,
    order_id: raw.order_id,
    user_id: raw.user_id,
    status: raw.status,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    paid_at: raw.paid_at,
    payment_method: raw.payment_method,
    shipping_data: raw.shipping_data,
    total_amount: raw.total_amount,
    pv: raw.pv,
    cv: raw.cv,
    country: raw.country,
    price_type: raw.price_type,
    is_kit: raw.is_kit,
    kit_type: raw.kit_type,
  }

  // Step 2: fetch items
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)

  if (itemsError) {
    console.warn('[useOrderDetail] order_items fetch failed:', itemsError.message)
  }

  const rawItems = (itemsData ?? []) as Array<{
    id: string
    product_code: string
    product_name: string | null
    quantity: number
    unit_price: number
    total_amount: number
    pv: number
    cv: number
  }>

  const productCodes = rawItems.map((i) => i.product_code).filter(Boolean)
  const shippingData = order.shipping_data as ShippingData

  // Step 3: parallel fetches
  const [
    cantidadMapResult,
    shippingResult,
    shipmentResult,
    commissionsResult,
  ] = await Promise.allSettled([
    fetchProductsCantidad(productCodes),
    fetchShipping(shippingData),
    fetchShipment(orderId),
    isAdmin ? fetchCommissions(orderId) : Promise.resolve([]),
  ])

  const cantidadMap =
    cantidadMapResult.status === 'fulfilled'
      ? cantidadMapResult.value
      : new Map<string, { cantidad: string | null; is_kit: boolean }>()

  const { label: shippingLabel, cediName } =
    shippingResult.status === 'fulfilled'
      ? shippingResult.value
      : { label: '—', cediName: null }

  const shipment =
    shipmentResult.status === 'fulfilled' ? shipmentResult.value : null

  const commissions =
    commissionsResult.status === 'fulfilled' ? commissionsResult.value : []

  // Merge cantidad + is_kit into items, sort kits first
  const items: OrderDetailItem[] = rawItems
    .map((item) => {
      const productInfo = cantidadMap.get(item.product_code)
      return {
        id: item.id,
        product_code: item.product_code,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount,
        pv: item.pv,
        cv: item.cv,
        cantidad: productInfo?.cantidad ?? null,
        is_kit: productInfo?.is_kit ?? false,
      }
    })
    .sort((a, b) => (b.is_kit ? 1 : 0) - (a.is_kit ? 1 : 0))

  return {
    order,
    items,
    shipment,
    commissions,
    shippingLabel,
    cediName,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOrderDetail(
  orderId: string,
  isAdmin: boolean
): {
  data: OrderDetailData | null
  loading: boolean
  error: string | null
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ['orderDetail', orderId, isAdmin],
    queryFn: () => fetchOrderDetail(orderId, isAdmin),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 2,
  })

  return {
    data: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
