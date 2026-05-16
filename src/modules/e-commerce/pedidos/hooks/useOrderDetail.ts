import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'
import { formatShippingMethod } from '../../../../lib/formatters.ts'
import type { ShippingData } from '../../../../lib/formatters.ts'

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
  kit_type: string | null // from products.kit_type
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
  shipping_cost: number
  tax_amount: number
  total_amount: number
  pv: number
  cv: number
  country: string | null
  price_type: string | null
  is_kit: boolean
  kit_type: string | null
}

export interface CediDetails {
  id: string
  nombre: string
  encargado: string | null
  telefono: string | null
  calle_numero: string | null
  colonia: string | null
  municipio: string | null
  estado: string | null
  codigo_postal: string | null
}

export interface OrderDetailData {
  order: FullOrderDetail
  items: OrderDetailItem[]
  shipment: OrderShipment | null
  commissions: OrderCommission[]
  shippingLabel: string // pre-resolved label
  cediName: string | null
  cediDetails: CediDetails | null
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchShipping(shippingData: ShippingData): Promise<{ label: string; cediName: string | null; cediDetails: CediDetails | null }> {
  if (!shippingData) {
    return { label: formatShippingMethod(null), cediName: null, cediDetails: null }
  }

  if (shippingData.type === 'cedi') {
    const { data, error } = await supabase
      .from('cedis')
      .select('id, nombre, encargado, telefono, calle_numero, colonia, municipio, estado, codigo_postal')
      .eq('id', shippingData.cedi_id)
      .single()

    if (error) {
      console.warn('[useOrderDetail] cedis fetch failed:', error.message)
      return { label: formatShippingMethod(shippingData), cediName: null, cediDetails: null }
    }

    const cedi = data as CediDetails | null
    const cediName = cedi?.nombre ?? null
    return { label: formatShippingMethod(shippingData, cediName ?? undefined), cediName, cediDetails: cedi }
  }

  if (shippingData.type === 'domicilio') {
    const { data, error } = await supabase
      .from('direcciones')
      .select('nombre_completo, calle_numero, colonia, municipio, estado, codigo_postal')
      .eq('id', shippingData.direccion_id)
      .single()

    if (error) {
      console.warn('[useOrderDetail] direcciones fetch failed:', error.message)
      return { label: 'Envío a domicilio', cediName: null, cediDetails: null }
    }

    if (!data) return { label: 'Envío a domicilio', cediName: null, cediDetails: null }

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

    return { label: parts.join(', ') || 'Envío a domicilio', cediName: null, cediDetails: null }
  }

  return { label: formatShippingMethod(shippingData), cediName: null, cediDetails: null }
}

async function fetchProductsCantidad(
  productCodes: string[]
): Promise<Map<string, { cantidad: string | null; is_kit: boolean }>> {
  if (productCodes.length === 0) return new Map()

  const { data, error } = await supabase
    .from('products')
    .select('code, cantidad, is_kit, kit_type')
    .in('code', productCodes)

  if (error) {
    console.warn('[useOrderDetail] products fetch failed:', error.message)
    return new Map()
  }

  const map = new Map<string, { cantidad: string | null; is_kit: boolean; kit_type: string | null }>()
  for (const row of (data ?? []) as Array<{ code: string; cantidad: string | null; is_kit: boolean; kit_type: string | null }>) {
    map.set(row.code, { cantidad: row.cantidad, is_kit: row.is_kit ?? false, kit_type: row.kit_type ?? null })
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
  orderId: string
): Promise<OrderDetailData> {
  // Step 1: fetch order — supports both UUID (id) and order code (order_id)
  // UUID pattern: 8-4-4-4-12 hex chars. Everything else is an order code.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)
  
  let orderQuery = supabase.from('orders').select('*')
  if (isUuid) {
    orderQuery = orderQuery.eq('id', orderId)
  } else {
    orderQuery = orderQuery.eq('order_id', orderId)
  }
  
  const { data: orderData, error: orderError } = await orderQuery.single()

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
    shipping_cost: Number(raw.shipping_cost ?? 0),
    tax_amount: Number(raw.tax_amount ?? 0),
    total_amount: raw.total_amount,
    pv: raw.pv,
    cv: raw.cv,
    country: raw.country,
    price_type: raw.price_type,
    is_kit: raw.is_kit,
    kit_type: raw.kit_type,
  }

  // Step 2: fetch items using the resolved UUID
  const { data: itemsData, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', raw.id)

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

  // All sub-queries MUST use the resolved order UUID, not the input orderId
  const resolvedOrderId = order.id
  const productCodes = rawItems.map((i) => i.product_code).filter(Boolean)
  const shippingData = order.shipping_data as ShippingData

  // Step 3: parallel fetches using resolved UUID
  const [
    cantidadMapResult,
    shippingResult,
    shipmentResult,
    commissionsResult,
  ] = await Promise.allSettled([
    fetchProductsCantidad(productCodes),
    fetchShipping(shippingData),
    fetchShipment(resolvedOrderId),
    fetchCommissions(resolvedOrderId),
  ])

  const cantidadMap =
    cantidadMapResult.status === 'fulfilled'
      ? cantidadMapResult.value
      : new Map<string, { cantidad: string | null; is_kit: boolean; kit_type: string | null }>()

  const { label: shippingLabel, cediName, cediDetails } =
    shippingResult.status === 'fulfilled'
      ? shippingResult.value
      : { label: '—', cediName: null, cediDetails: null }

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
        kit_type: productInfo?.kit_type ?? null,
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
    cediDetails,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOrderDetail(
  orderId: string
): {
  data: OrderDetailData | null
  loading: boolean
  error: string | null
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ['orderDetail', orderId],
    queryFn: () => fetchOrderDetail(orderId),
    enabled: !!orderId,
    staleTime: 1000 * 60 * 2,
  })

  return {
    data: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
  }
}
