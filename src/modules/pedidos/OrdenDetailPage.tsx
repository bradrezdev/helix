import { useState } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { useOrder } from '../../hooks/useOrder'
import type { ShippingDetail } from '../../hooks/useOrder'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(amount: number | null): string {
  if (amount == null) return '$—'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDatetime(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-wide mb-3"
      style={{ color: 'rgba(56,58,63,0.60)', fontFamily: 'Poppins, sans-serif' }}
    >
      {children}
    </p>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="bg-white rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-5"
      style={{ border: '1px solid #EAECF0' }}
    >
      {children}
    </div>
  )
}

function StatusPill({ status }: { status: string | null }) {
  const cfg =
    status === 'paid'
      ? { bg: '#DCFCE7', text: '#16A34A', label: 'Completado' }
      : status === 'cancelled'
      ? { bg: '#FEF2F2', text: '#EF4444', label: 'Cancelado' }
      : { bg: '#FEF3C7', text: '#D97706', label: 'Pendiente' }

  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.text, fontFamily: 'Poppins, sans-serif' }}
    >
      {cfg.label}
    </span>
  )
}

function ShippingSection({ detail }: { detail: ShippingDetail }) {
  if (detail.type === 'cedi') {
    const c = detail.data
    return (
      <div className="space-y-1">
        <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
          {c.nombre}
        </p>
        <p className="text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
          {c.calle_numero}, {c.municipio}, {c.estado}
        </p>
        {c.encargado && (
          <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
            Encargado: {c.encargado}
          </p>
        )}
        {c.telefono && (
          <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
            Tel: {c.telefono}
          </p>
        )}
      </div>
    )
  }

  if (detail.type === 'domicilio') {
    const d = detail.data
    return (
      <div className="space-y-1">
        <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
          {d.nombre_completo}
        </p>
        <p className="text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
          {d.calle_numero}, {d.colonia}
        </p>
        <p className="text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
          {d.municipio}, {d.estado} C.P. {d.codigo_postal}
        </p>
      </div>
    )
  }

  return (
    <p className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
      Recogida en tienda / Sin envío
    </p>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded-full transition-colors hover:bg-[#F2F4F9]"
      title="Copiar ID"
    >
      {copied ? (
        <Check size={14} style={{ color: '#16A34A' }} />
      ) : (
        <Copy size={14} style={{ color: '#9CA3AF' }} />
      )}
    </button>
  )
}

// ─── OrdenDetailPage ──────────────────────────────────────────────────────────

export function OrdenDetailPage() {
  const { orderId } = useParams({ from: '/authenticated/ordenes/$orderId' })
  const navigate = useNavigate()
  const { order, shippingDetail, loading, error } = useOrder(orderId)

  const shortId = orderId ? `#${orderId.slice(-6).toUpperCase()}` : ''

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F2F4F9] px-5 pt-8 pb-28 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-white animate-pulse" />
          <div className="h-6 w-40 rounded-full bg-white animate-pulse" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-[32px] h-32 animate-pulse" />
        ))}
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#F2F4F9] px-5 pt-8 flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {error ?? 'Orden no encontrada'}
        </p>
        <button
          onClick={() => navigate({ to: '/ordenes' })}
          className="px-5 py-2 rounded-full text-sm font-medium text-white"
          style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Volver
        </button>
      </main>
    )
  }

  const items = order.order_items ?? []
  const paymentLabel =
    order.payment_method === 'wallet'
      ? 'Billetera Virtual'
      : order.payment_method === 'admin'
      ? 'Asignación administrativa'
      : order.payment_method === 'card'
      ? 'Tarjeta'
      : order.payment_method ?? '—'

  return (
    <main
      className="min-h-screen pb-28"
      style={{ backgroundColor: '#F2F4F9' }}
    >
      {/* Header */}
      <div className="px-5 pt-8 pb-5 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/ordenes' })}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(6,42,99,0.07)] transition-transform active:scale-95"
          style={{ border: '1px solid #EAECF0' }}
        >
          <ArrowLeft size={18} style={{ color: '#062A63' }} />
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <h1
            className="text-xl font-semibold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            Orden {shortId}
          </h1>
          <StatusPill status={order.status ?? null} />
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* PRODUCTOS */}
        <div>
          <SectionLabel>Productos</SectionLabel>
          <Card>
            <div className="space-y-0 divide-y divide-[#EAECF0]">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                      {item.product_name ?? item.product_code}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
                      {item.quantity} × {formatMXN(item.unit_price)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold shrink-0" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                    {formatMXN(item.total_amount)}
                  </p>
                </div>
              ))}
              {items.length === 0 && (
                <p className="py-3 text-sm text-center" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
                  Sin productos
                </p>
              )}
            </div>
            {/* Totals */}
            <div className="border-t border-[#EAECF0] pt-3 mt-1 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>Total</span>
                <span className="text-sm font-bold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                  {formatMXN(order.total_amount)}
                </span>
              </div>
              {order.pv != null && (
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>PV Total</span>
                  <span className="text-sm font-semibold" style={{ color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}>
                    {order.pv} PV
                  </span>
                </div>
              )}
              {order.cv != null && (
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>CV Total</span>
                  <span className="text-sm font-semibold" style={{ color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}>
                    {order.cv} CV
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ENVÍO */}
        <div>
          <SectionLabel>Envío</SectionLabel>
          <Card>
            <ShippingSection detail={shippingDetail} />
          </Card>
        </div>

        {/* PAGO */}
        <div>
          <SectionLabel>Pago</SectionLabel>
          <Card>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: '#EFF6FF', color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
                >
                  {paymentLabel}
                </span>
              </div>
              {order.status === 'pending' ? (
                <p className="text-sm font-medium" style={{ color: '#D97706', fontFamily: 'Poppins, sans-serif' }}>
                  Pendiente de pago
                </p>
              ) : (
                order.paid_at && (
                  <p className="text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                    Pagado el {formatDatetime(order.paid_at)}
                  </p>
                )
              )}
            </div>
          </Card>
        </div>

        {/* INFORMACIÓN */}
        <div>
          <SectionLabel>Información</SectionLabel>
          <Card>
            <div className="space-y-3">
              <div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>ID de orden</p>
                <div className="flex items-center gap-1">
                  <span
                    className="text-sm font-semibold font-mono"
                    style={{ color: '#383A3F' }}
                  >
                    #{order.order_id ?? order.id.slice(-6).toUpperCase()}
                  </span>
                  <CopyButton text={order.order_id ?? order.id} />
                </div>
              </div>
              <div>
                <p className="text-xs mb-1" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>Fecha de creación</p>
                <p className="text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                  {formatDate(order.created_at)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}
