import React from 'react'
import type { ShippingData } from '../lib/formatters'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderReceiptPDFProps {
  order: {
    order_id: string | null
    created_at: string | null
    status: string | null
    payment_method: string | null
    shipping_data: unknown
    total_amount: number | null
    pv: number | null
    cv: number | null
    shipping_cost?: number | null
    tax_amount?: number | null
    tax_label?: string | null
    tax_rate?: number | null
  }
  items: Array<{
    product_name: string | null
    product_code: string
    quantity: number
    unit_price: number
    total_amount: number
  }>
  user: {
    name: string
    apellidos: string | null
    user_id: number
  }
  cediName?: string
}

// ─── Lazy PDF helpers ─────────────────────────────────────────────────────────

export async function viewOrderPDF(props: OrderReceiptPDFProps): Promise<void> {
  const [{ pdf }, { OrderReceiptDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./OrderReceiptDocument'),
  ])
  const blob = await pdf(React.createElement(OrderReceiptDocument, props)).toBlob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

export async function downloadOrderPDF(
  props: OrderReceiptPDFProps,
  filename?: string,
): Promise<void> {
  const [{ pdf }, { OrderReceiptDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./OrderReceiptDocument'),
  ])
  const blob = await pdf(React.createElement(OrderReceiptDocument, props)).toBlob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename ?? `recibo-${props.order.order_id ?? 'orden'}.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export type { ShippingData }
