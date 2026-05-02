import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useIsAdmin } from '../../hooks/useAdmin'
import { useOrderDetail } from '../../hooks/useOrderDetail'
import { useTaxRate } from '../../hooks/useTaxRate'
import { PDFDropdownButton } from '../../components/PDFDropdownButton'
import { ProductCard } from './components/ProductCard'
import { AuditarSection } from './components/AuditarSection'
import {
  formatOrderStatus,
  formatPaymentMethod,
  formatDateTime,
  formatAmount,
} from '../../lib/formatters'

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  paid: { bg: '#DCFCE7', text: '#16A34A' },
  completo: { bg: '#DCFCE7', text: '#16A34A' },
  en_proceso: { bg: '#EFF6FF', text: '#2563EB' },
  cancelled: { bg: '#FEF2F2', text: '#EF4444' },
  reembolsado: { bg: '#F5F3FF', text: '#7C3AED' },
}

function StatusPill({ status }: { status: string | null }) {
  const cfg = STATUS_COLORS[status ?? ''] ?? { bg: '#FEF3C7', text: '#D97706' }
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.text, fontFamily: 'Poppins, sans-serif' }}
    >
      {formatOrderStatus(status)}
    </span>
  )
}

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span
        className="text-xs shrink-0"
        style={{
          color: 'rgba(6,42,99,0.60)',
          fontFamily: 'Poppins, sans-serif',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </span>
      <span
        className="text-xs text-right"
        style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── OrdenDetailPage ──────────────────────────────────────────────────────────

export function OrdenDetailPage() {
  const { orderId } = useParams({ from: '/authenticated/ordenes/$orderId' })
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id ?? '')
  const isAdmin = useIsAdmin()
  const { data, loading, error } = useOrderDetail(orderId)

  // Derive country from order (available after data loads) or fall back to 'MXN'
  const orderCountry = data?.order.country ?? 'MXN'
  const { rate: taxRate, label: taxLabel } = useTaxRate(orderCountry)

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="min-h-screen bg-[#F2F4F9] px-5 pt-8 pb-28 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-full bg-white animate-pulse" />
          <div className="h-6 w-40 rounded-full bg-white animate-pulse" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-[16px] h-28 animate-pulse" />
        ))}
      </main>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !data) {
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

  const { order, items, shipment, commissions, shippingLabel, cediName } = data

  // ── Tax + totals calculation ──────────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + item.total_amount, 0)
  const shippingCost = order.shipping_cost
  const taxAmount = subtotal * taxRate
  const computedTotal = subtotal + shippingCost + taxAmount

  // ── PDF props ────────────────────────────────────────────────────────────────
  const pdfProps = {
    order: {
      order_id: order.order_id ?? null,
      created_at: order.created_at,
      status: order.status ?? null,
      payment_method: order.payment_method ?? null,
      shipping_data: order.shipping_data ?? null,
      total_amount: computedTotal,
      pv: order.pv ?? null,
      cv: order.cv ?? null,
      shipping_cost: shippingCost,
      tax_amount: taxAmount,
      tax_label: taxLabel,
      tax_rate: taxRate,
    },
    items: items.map((item) => ({
      product_name: item.product_name ?? null,
      product_code: item.product_code,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_amount: item.total_amount,
    })),
    user: {
      name: profile?.name ?? '',
      apellidos: profile?.apellidos ?? null,
      user_id: profile?.user_id ?? 0,
    },
    cediName: cediName ?? undefined,
  }

  // ── Shipping button ──────────────────────────────────────────────────────────
  const hasGuia = !!shipment?.guia_rastreo
  const guiaLabel = shipment
    ? [shipment.carrier, shipment.guia_rastreo].filter(Boolean).join(' — ')
    : 'Sin guía asignada'

  return (
    <main className="min-h-screen pb-28" style={{ backgroundColor: '#F2F4F9' }} data-testid="order-detail-container">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/ordenes' })}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(6,42,99,0.07)] transition-transform active:scale-95"
          style={{ border: '1px solid #EAECF0' }}
        >
          <ArrowLeft size={18} style={{ color: '#062A63' }} />
        </button>
        <div className="flex-1" />
      </div>

      <div className="px-5 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="space-y-2" data-testid="order-detail-header">
          <h1
            className="font-semibold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif', fontSize: '22px' }}
          >
            Orden #{order.order_id != null ? Number(order.order_id) : '—'}
          </h1>
          <p
            className="font-semibold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif', fontSize: '24px' }}
          >
            {formatAmount(computedTotal, order.country)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#E0F9FF', color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}
            >
              {order.pv} PV
            </span>
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
              style={{ backgroundColor: '#E0F9FF', color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}
            >
              {order.cv} CV
            </span>
            <StatusPill status={order.status ?? null} />
          </div>
        </div>

        {/* ── Estado de envío button ──────────────────────────────────────── */}
        {hasGuia ? (
          <a
            href={`https://tracking.com/${shipment!.guia_rastreo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-medium border transition-colors hover:bg-[#F2F4F9]"
            style={{
              color: '#062A63',
              borderColor: '#062A63',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            <ExternalLink size={14} />
            {guiaLabel}
          </a>
        ) : (
          <button
            disabled
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[12px] text-sm font-medium border cursor-not-allowed opacity-50"
            style={{
              color: '#062A63',
              borderColor: '#062A63',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Sin guía asignada
          </button>
        )}

        <hr className="border-[#EAECF0] my-4" />

        {/* ── Envío section ────────────────────────────────────────────────── */}
        <div className="space-y-3" data-testid="order-detail-shipping">
          <p
            className="font-semibold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif', fontSize: '17px' }}
          >
            Envío
          </p>
          <div
            className="bg-white rounded-[16px] shadow-sm p-4 space-y-2"
            style={{ border: '1px solid #EAECF0' }}
          >
            {shippingLabel && shippingLabel !== '—' ? (
              <>
                <DetailRow label="Dirección" value={shippingLabel} />
                {cediName && <DetailRow label="CEDI" value={cediName} />}
              </>
            ) : (
              <p
                className="text-sm text-center py-4"
                style={{ color: 'rgba(6,42,99,0.40)', fontFamily: 'Poppins, sans-serif' }}
              >
                No hay información de envío
              </p>
            )}
          </div>
        </div>

        <hr className="border-[#EAECF0] my-4" />

        {/* ── Detalles section ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <p
            className="font-semibold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif', fontSize: '17px' }}
          >
            Detalles
          </p>
          <div
            className="bg-white rounded-[16px] shadow-sm p-4 space-y-3"
            style={{ border: '1px solid #EAECF0' }}
          >
            <DetailRow label="Creado" value={formatDateTime(order.created_at)} />
            {isAdmin && (
              <DetailRow label="Actualizado" value={formatDateTime(order.updated_at)} />
            )}
            <DetailRow label="Pago" value={formatPaymentMethod(order.payment_method)} />
          </div>
        </div>

        <hr className="border-[#EAECF0] my-4" />

        {/* ── Productos section ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          <p
            className="font-semibold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif', fontSize: '17px' }}
          >
            Productos
          </p>
          <div className="space-y-3" data-testid="order-detail-items">
            {items.length === 0 ? (
              <p
                className="text-sm text-center py-4"
                style={{ color: 'rgba(6,42,99,0.40)', fontFamily: 'Poppins, sans-serif' }}
                data-testid="order-detail-empty"
              >
                No hay artículos en esta orden
              </p>
            ) : (
              items.map((item) => (
                <ProductCard key={item.id} item={item} country={order.country} />
              ))
            )}
          </div>
          <div className="flex justify-end">
            <PDFDropdownButton {...pdfProps} />
          </div>
        </div>

        {/* ── Totals breakdown ─────────────────────────────────────────────── */}
        <div
          className="bg-white rounded-[16px] shadow-sm p-4 space-y-2"
          style={{ border: '1px solid #EAECF0' }}
        >
          <DetailRow
            label="Subtotal"
            value={formatAmount(subtotal, order.country)}
          />
          {shippingCost > 0 && (
            <DetailRow
              label="Envio"
              value={formatAmount(shippingCost, order.country)}
            />
          )}
          {taxRate > 0 && (
            <DetailRow
              label={`${taxLabel} (${(taxRate * 100).toFixed(0)}%)`}
              value={formatAmount(taxAmount, order.country)}
            />
          )}
          <div
            className="flex items-start justify-between gap-4 pt-2"
            style={{ borderTop: '1px solid #EAECF0' }}
          >
            <span
              className="text-xs font-semibold shrink-0"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Total
            </span>
            <span
              className="text-sm font-bold text-right"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              {formatAmount(computedTotal, order.country)}
            </span>
          </div>
        </div>

        {/* ── Auditar section ──────────────────────────────────────────────── */}
        <hr className="border-[#EAECF0] my-4" />
        <div data-testid="order-detail-commissions">
          <AuditarSection
            commissions={commissions}
            loading={loading}
            country={order.country}
          />
        </div>
      </div>
    </main>
  )
}
