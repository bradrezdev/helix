import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'

export interface AdminOrderFilter {
  orderId?: string
  userName?: string
  status?: string
  paymentMethod?: string
  shippingType?: string
  dateFrom?: string
  dateTo?: string
  updatedFrom?: string
  updatedTo?: string
  sortBy?: 'created_at' | 'updated_at' | 'order_id'
  sortDir?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface AdminOrderUser {
  id: string
  name: string
  apellidos: string | null
  user_id: number
  country: string | null
  enrollment_date: string | null
  sponsor_id: string | null
  sponsor_name?: string | null
}

export interface AdminOrderItem {
  id: string
  product_code: string
  product_name: string | null
  quantity: number
  unit_price: number
  total_amount: number
  pv: number
  cv: number
}

export interface AdminOrder {
  id: string
  order_id: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
  payment_method: string | null
  shipping_data: unknown
  total_amount: number | null
  pv: number
  cv: number
  user: AdminOrderUser
  items: AdminOrderItem[]
  cedi_name?: string | null
}

// Raw row shape returned by Supabase before transformation
interface RawOrderUser {
  id: string
  name: string
  apellidos: string | null
  user_id: number
  country: string | null
  enrollment_date: string | null
  sponsor_id: string | null
}

interface RawOrderRow extends Record<string, unknown> {
  id: string
  order_id: string | null
  status: string | null
  created_at: string | null
  pv: number
  cv: number
  total_amount: number | null
  users: RawOrderUser | null
  order_items: Tables<'order_items'>[]
}

const PAGE_SIZE_DEFAULT = 20

async function fetchAdminOrders(
  filter: AdminOrderFilter,
): Promise<{ orders: AdminOrder[]; total: number }> {
  const page = filter.page ?? 0
  const pageSize = filter.pageSize ?? PAGE_SIZE_DEFAULT
  const from = page * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('orders')
    .select(
      `
      *,
      users!orders_user_id_fkey(id, name, apellidos, user_id, country, enrollment_date, sponsor_id),
      order_items(id, product_code, product_name, quantity, unit_price, total_amount, pv, cv)
    `,
      { count: 'exact' },
    )

  if (filter.orderId) {
    query = query.ilike('order_id', `%${filter.orderId}%`)
  }

  if (filter.status) {
    query = query.eq('status', filter.status)
  }

  if (filter.paymentMethod) {
    query = query.eq('payment_method', filter.paymentMethod)
  }

  if (filter.dateFrom) {
    query = query.gte('created_at', filter.dateFrom)
  }

  if (filter.dateTo) {
    // Include full day by appending end-of-day
    query = query.lte('created_at', filter.dateTo + 'T23:59:59.999Z')
  }

  if (filter.updatedFrom) {
    query = query.gte('updated_at', filter.updatedFrom)
  }

  if (filter.updatedTo) {
    query = query.lte('updated_at', filter.updatedTo + 'T23:59:59.999Z')
  }

  const sortBy = filter.sortBy ?? 'created_at'
  const ascending = filter.sortDir === 'asc'
  query = query.order(sortBy, { ascending })

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  const rows = (data ?? []) as unknown as RawOrderRow[]

  // Collect unique sponsor UUIDs for batch name resolution
  const sponsorIds = new Set<string>()
  for (const row of rows) {
    const sponsorId = row.users?.sponsor_id
    if (sponsorId) sponsorIds.add(sponsorId)
  }

  // Batch fetch sponsor names
  const sponsorNameMap = new Map<string, string>()
  if (sponsorIds.size > 0) {
    const { data: sponsorData } = await supabase
      .from('users')
      .select('id, name, apellidos')
      .in('id', Array.from(sponsorIds))

    if (sponsorData) {
      for (const s of sponsorData) {
        const fullName = [s.name, s.apellidos].filter(Boolean).join(' ')
        sponsorNameMap.set(s.id, fullName)
      }
    }
  }

  // Apply userName filter client-side (PostgREST nested ilike not straightforward)
  let filteredRows = rows
  if (filter.userName) {
    const search = filter.userName.toLowerCase()
    filteredRows = rows.filter((row) => {
      const user = row.users
      if (!user) return false
      const fullName = [user.name, user.apellidos].filter(Boolean).join(' ').toLowerCase()
      return fullName.includes(search)
    })
  }

  // Apply shippingType filter client-side (shipping_data is JSONB)
  if (filter.shippingType) {
    const shippingType = filter.shippingType
    filteredRows = filteredRows.filter((row) => {
      const shipping = row.shipping_data as Record<string, unknown> | null
      return shipping?.type === shippingType
    })
  }

  // Collect unique CEDI IDs for batch name resolution
  const cediIds = new Set<string>()
  for (const row of filteredRows) {
    const shipping = row.shipping_data as Record<string, unknown> | null
    if (shipping?.type === 'cedi' && shipping.cedi_id) {
      cediIds.add(String(shipping.cedi_id))
    }
  }

  // Batch fetch CEDI names
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

  const orders: AdminOrder[] = filteredRows.map((row) => {
    const rawUser = row.users
    const user: AdminOrderUser = rawUser
      ? {
          id: rawUser.id,
          name: rawUser.name,
          apellidos: rawUser.apellidos,
          user_id: rawUser.user_id,
          country: rawUser.country,
          enrollment_date: rawUser.enrollment_date,
          sponsor_id: rawUser.sponsor_id,
          sponsor_name: rawUser.sponsor_id ? (sponsorNameMap.get(rawUser.sponsor_id) ?? null) : null,
        }
      : {
          id: '',
          name: 'Usuario desconocido',
          apellidos: null,
          user_id: 0,
          country: null,
          enrollment_date: null,
          sponsor_id: null,
          sponsor_name: null,
        }

    const items: AdminOrderItem[] = (row.order_items ?? []).map((item) => ({
      id: item.id,
      product_code: item.product_code,
      product_name: item.product_name ?? null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_amount: item.total_amount,
      pv: item.pv,
      cv: item.cv,
    }))

    const shippingForCedi = row.shipping_data as Record<string, unknown> | null
    const cediName =
      shippingForCedi?.type === 'cedi' && shippingForCedi.cedi_id
        ? (cediNameMap.get(String(shippingForCedi.cedi_id)) ?? null)
        : null

    return {
      id: row.id,
      order_id: row.order_id,
      status: row.status,
      created_at: row.created_at,
      updated_at: (row.updated_at as string | null) ?? null,
      payment_method: (row.payment_method as string | null) ?? null,
      shipping_data: row.shipping_data ?? null,
      total_amount: row.total_amount,
      pv: row.pv,
      cv: row.cv,
      user,
      items,
      cedi_name: cediName,
    }
  })

  return { orders, total: count ?? 0 }
}

interface UseAdminOrdersResult {
  orders: AdminOrder[]
  loading: boolean
  error: string | null
  total: number
  page: number
  filter: AdminOrderFilter
  setFilter: (filter: AdminOrderFilter) => void
}

export function useAdminOrders(initialFilter: AdminOrderFilter = {}): UseAdminOrdersResult {
  const [filter, setFilterState] = useState<AdminOrderFilter>(initialFilter)
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const page = filter.page ?? 0

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchAdminOrders(filter)
        if (!cancelled) {
          setOrders(result.orders)
          setTotal(result.total)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar órdenes')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [filter])

  function setFilter(newFilter: AdminOrderFilter) {
    setFilterState(newFilter)
  }

  return { orders, loading, error, total, page, filter, setFilter }
}
