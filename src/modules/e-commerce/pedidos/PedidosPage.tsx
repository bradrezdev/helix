import { useState } from 'react'
import { SlidersHorizontal, PackageOpen, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../auth/hooks/useAuth.ts'
import { useProfile } from '../../auth/hooks/useProfile.ts'
import { useIsAdmin } from '../../admin/hooks/useAdmin.ts'
import { usePedidos } from './hooks/usePedidos.ts'
import type { OrderWithItems, PedidosFilter } from './hooks/usePedidos.ts'
import type { UserProfile } from '../../auth/hooks/useProfile.ts'
import { useNetworkPedidos } from '../../network/inscripciones/hooks/useNetworkPedidos.ts'
import type { NetworkOrder } from '../../network/inscripciones/hooks/useNetworkPedidos.ts'
import { PDFDropdownButton } from './components/PDFDropdownButton.tsx'
import {
  formatOrderStatus,
  formatPaymentMethod,
  formatDateTime,
  OrderStatus,
} from '../../../lib/formatters.ts'
import type { ShippingData } from '../../../lib/formatters.ts'

// ─── Types ─────────────────────────────────────────────────────────────────────

type PedidosMode = 'own' | 'network'
type OrderDisplay = OrderWithItems | NetworkOrder

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: OrderStatus.Pending, label: 'Pendiente' },
  { value: OrderStatus.Paid, label: 'Completado' },
  { value: OrderStatus.EnProceso, label: 'En proceso' },
  { value: OrderStatus.Cancelled, label: 'Cancelado' },
  { value: OrderStatus.Reembolsado, label: 'Reembolsado' },
]

const PAYMENT_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'wallet', label: 'Billetera' },
  { value: 'admin', label: 'Admin' },
]

const SHIPPING_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'domicilio', label: 'Domicilio' },
  { value: 'cedi', label: 'CEDI' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  paid: { bg: '#DCFCE7', text: '#16A34A' },
  cancelled: { bg: '#FEF2F2', text: '#EF4444' },
  en_proceso: { bg: '#EFF6FF', text: '#2563EB' },
  reembolsado: { bg: '#F5F3FF', text: '#7C3AED' },
  default: { bg: '#F3F4F6', text: '#9CA3AF' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(amount: number | null | undefined): string {
  if (amount == null) return '$—'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function getShippingLabel(order: OrderWithItems): string {
  const sd = order.shipping_data as ShippingData
  if (!sd) return '—'
  // Read method directly from shipping_data.type
  if (sd.type === 'domicilio') return 'Domicilio'
  if (sd.type === 'cedi') return order.cedi_name ?? 'CEDI'
  return '—'
}

/** Check if an order display object is a network order (has buyer info). */
function isNetworkOrder(order: OrderDisplay): order is NetworkOrder {
  return 'buyer_name' in order
}

function getOrderDisplayId(order: OrderDisplay): string {
  return isNetworkOrder(order) ? `#${order.order_code.slice(-8).toUpperCase()}` : `#${order.id.slice(-8).toUpperCase()}`
  // For own orders, show last 8 chars of UUID as order ID
}

function getOrderNavId(order: OrderDisplay): string {
  return order.id
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  const cfg = STATUS_COLORS[status ?? ''] ?? STATUS_COLORS['default']
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: cfg.bg,
        color: cfg.text,
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {formatOrderStatus(status)}
    </span>
  )
}

// ─── FilterPanel ──────────────────────────────────────────────────────────────

interface FilterPanelProps {
  filter: PedidosFilter
  onApply: (f: PedidosFilter) => void
  onClose: () => void
}

function FilterPanel({ filter, onApply, onClose }: FilterPanelProps) {
  const [draft, setDraft] = useState<PedidosFilter>({ ...filter })

  function update(key: keyof PedidosFilter, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value || undefined }))
  }

  function handleApply() {
    onApply({ ...draft })
    onClose()
  }

  function handleClear() {
    onApply({ sortDir: 'desc' })
    onClose()
  }

  return (
    <div
      className="rounded-[20px] p-5 mb-4"
      style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0 2px 12px rgba(6,42,99,0.07)' }}
    >
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FilterSelect
          label="Estado"
          value={draft.status ?? ''}
          options={STATUS_OPTIONS}
          onChange={(v) => update('status', v)}
        />
        <FilterSelect
          label="Método de pago"
          value={draft.paymentMethod ?? ''}
          options={PAYMENT_OPTIONS}
          onChange={(v) => update('paymentMethod', v)}
        />
        <FilterSelect
          label="Tipo de envío"
          value={draft.shippingType ?? ''}
          options={SHIPPING_OPTIONS}
          onChange={(v) => update('shippingType', v)}
        />
        <FilterSelect
          label="Ordenar"
          value={draft.sortDir ?? 'desc'}
          options={[
            { value: 'desc', label: 'Más reciente' },
            { value: 'asc', label: 'Más antiguo' },
          ]}
          onChange={(v) => update('sortDir', v)}
        />
        <FilterInput
          label="Desde"
          type="date"
          value={draft.dateFrom ?? ''}
          onChange={(v) => update('dateFrom', v)}
        />
        <FilterInput
          label="Hasta"
          type="date"
          value={draft.dateTo ?? ''}
          onChange={(v) => update('dateTo', v)}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleApply}
          className="flex-1 py-2.5 rounded-[12px] text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Aplicar filtros
        </button>
        <button
          onClick={handleClear}
          className="px-5 py-2.5 rounded-[12px] text-sm font-medium transition-colors hover:bg-gray-50"
          style={{ color: '#9CA3AF', border: '1px solid #EAECF0', fontFamily: 'Poppins, sans-serif' }}
        >
          Limpiar
        </button>
      </div>
    </div>
  )
}

function FilterInput({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <p className="text-[10px] mb-1" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
        {label}
      </p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-[10px] text-xs outline-none"
        style={{ border: '1px solid #EAECF0', color: '#383A3F', fontFamily: 'Poppins, sans-serif', backgroundColor: '#F8FAFC' }}
      />
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <p className="text-[10px] mb-1" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
        {label}
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-[10px] text-xs outline-none"
        style={{ border: '1px solid #EAECF0', color: '#383A3F', fontFamily: 'Poppins, sans-serif', backgroundColor: '#F8FAFC' }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── ActiveFilterChips ────────────────────────────────────────────────────────

function ActiveFilterChips({
  filter,
  onRemove,
}: {
  filter: PedidosFilter
  onRemove: (key: keyof PedidosFilter) => void
}) {
  const chips: { key: keyof PedidosFilter; label: string }[] = []
  if (filter.status) chips.push({ key: 'status', label: formatOrderStatus(filter.status) })
  if (filter.paymentMethod)
    chips.push({ key: 'paymentMethod', label: formatPaymentMethod(filter.paymentMethod) })
  if (filter.shippingType) chips.push({ key: 'shippingType', label: `Envío: ${filter.shippingType}` })
  if (filter.dateFrom) chips.push({ key: 'dateFrom', label: `Desde: ${filter.dateFrom}` })
  if (filter.dateTo) chips.push({ key: 'dateTo', label: `Hasta: ${filter.dateTo}` })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map(({ key, label }) => (
        <span
          key={key}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#EFF6FF', color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {label}
          <button
            onClick={() => onRemove(key)}
            className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-blue-100"
          >
            <X size={10} style={{ color: '#062A63' }} />
          </button>
        </span>
      ))}
    </div>
  )
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

interface OrderCardProps {
  order: OrderDisplay
  profile?: UserProfile | null
  showBuyerInfo?: boolean
  buyerName?: string
  treeLevel?: number
}

function OrderCard({ order, profile, showBuyerInfo, buyerName, treeLevel }: OrderCardProps) {
  const navigate = useNavigate()
  const isNetwork = isNetworkOrder(order)

  const orderDisplayId = getOrderDisplayId(order)
  const navId = getOrderNavId(order)

  // Own-order specific data
  const items = isNetwork ? [] : ((order as OrderWithItems).order_items ?? [])
  const shippingLabel = isNetwork ? '' : getShippingLabel(order as OrderWithItems)
  const paymentLabel = isNetwork ? '' : formatPaymentMethod((order as OrderWithItems).payment_method)

  const pdfProps = isNetwork
    ? undefined
    : {
        order: {
          order_id: (order as OrderWithItems).order_id ?? null,
          created_at: order.created_at,
          status: order.status ?? null,
          payment_method: (order as OrderWithItems).payment_method ?? null,
          shipping_data: (order as OrderWithItems).shipping_data ?? null,
          total_amount: order.total_amount,
          pv: ((order as OrderWithItems) as unknown as { pv?: number | null }).pv ?? null,
          cv: ((order as OrderWithItems) as unknown as { cv?: number | null }).cv ?? null,
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
        cediName: (order as OrderWithItems).cedi_name ?? undefined,
      }

  return (
    <div
      className="bg-white rounded-[16px] shadow-sm p-4"
      style={{ border: '1px solid #EAECF0' }}
      data-testid={`pedidos-order-card-${order.id}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            Orden {orderDisplayId}
          </span>
          <StatusBadge status={order.status ?? null} />
        </div>
        <span
          className="text-xs"
          style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
        >
          {formatDateTime(order.created_at)}
        </span>
      </div>

      {/* Buyer info chip — network mode only */}
      {showBuyerInfo && buyerName && (
        <div className="flex items-center gap-2 mb-3">
          <span
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: 'rgba(12,188,229,0.10)',
              color: '#0CBCE5',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {buyerName}
          </span>
          {treeLevel != null && (
            <span
              className="text-[10px] font-medium"
              style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
            >
              Nivel {treeLevel}
            </span>
          )}
        </div>
      )}

      {/* Meta row — own orders only */}
      {!isNetwork && (
        <div className="flex flex-wrap gap-3 mb-3">
          <MetaChip label="Pago" value={paymentLabel} />
          <MetaChip label="Envío" value={shippingLabel} />
        </div>
      )}

      {/* Product summary — own orders only */}
      {!isNetwork && items.length > 0 && (
        <div
          className="rounded-[12px] p-3 mb-3 space-y-1"
          style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}
        >
          {items.map((item, idx) => (
            <p
              key={idx}
              className="text-xs"
              style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
            >
              {item.product_name ?? item.product_code} ×{item.quantity}
            </p>
          ))}
        </div>
      )}

      {/* Footer: total + actions */}
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-bold"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {formatMXN(order.total_amount)}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: '/ordenes/$orderId', params: { orderId: navId } })}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              color: '#0CBCE5',
              border: '1px solid #0CBCE5',
              fontFamily: 'Poppins, sans-serif',
            }}
            data-testid={`pedidos-ver-detalles-${navId}`}
          >
            Ver detalles
          </button>
          {pdfProps && <PDFDropdownButton {...pdfProps} />}
        </div>
      </div>
    </div>
  )
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ backgroundColor: '#F8FAFC', border: '1px solid #EAECF0' }}
    >
      <span
        className="text-[10px]"
        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}:
      </span>
      <span
        className="text-[10px] font-medium"
        style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div
        className="w-16 h-16 rounded-[32px] flex items-center justify-center"
        style={{ backgroundColor: '#F1F5F9' }}
      >
        <PackageOpen size={28} style={{ color: '#9CA3AF' }} />
      </div>
      <p
        className="text-sm font-medium"
        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        No tienes órdenes
      </p>
    </div>
  )
}

function NetworkEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 px-5 text-center">
      <div
        className="w-16 h-16 rounded-[32px] flex items-center justify-center"
        style={{ backgroundColor: '#F1F5F9' }}
      >
        <PackageOpen size={28} style={{ color: '#9CA3AF' }} />
      </div>
      <p
        className="text-sm font-medium max-w-xs"
        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        Tu red no tiene órdenes en este periodo. Cuando los miembros de tu organización compren productos, aparecerán aquí.
      </p>
    </div>
  )
}

// ─── PedidosPage ──────────────────────────────────────────────────────────────

export function PedidosPage() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? '')
  const isAdmin = useIsAdmin()
  const [mode, setMode] = useState<PedidosMode>('own')
  const [networkPage, setNetworkPage] = useState(1)
  const [filter, setFilter] = useState<PedidosFilter>({ sortDir: 'desc' })
  const [showFilters, setShowFilters] = useState(false)

  // ── Queries ─────────────────────────────────────────────────────────────────

  const ownQuery = usePedidos(user?.id ?? '', filter, isAdmin)

  const networkQuery = useNetworkPedidos({
    userId: profile?.id,
    page: networkPage,
    pageSize: 20,
    status: filter.status,
    dateFrom: filter.dateFrom || undefined,
    dateTo: filter.dateTo || undefined,
  })

  // ── Unified values ──────────────────────────────────────────────────────────

  const isLoading = mode === 'own' ? ownQuery.isLoading : networkQuery.isLoading
  const isError = mode === 'own' ? ownQuery.isError : networkQuery.isError
  const total = mode === 'own' ? (ownQuery.data?.length ?? 0) : (networkQuery.data?.total ?? 0)

  const orders: OrderDisplay[] = mode === 'own'
    ? (ownQuery.data ?? [])
    : (networkQuery.data?.orders ?? [])

  const totalPages = Math.max(1, Math.ceil(total / 20))

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleModeChange(newMode: PedidosMode) {
    setMode(newMode)
    if (newMode === 'network') setNetworkPage(1)
  }

  function handleApplyFilter(f: PedidosFilter) {
    setFilter(f)
    setNetworkPage(1)
  }

  function handleRemoveChip(key: keyof PedidosFilter) {
    setFilter((prev) => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
    setNetworkPage(1)
  }

  function handlePrevPage() {
    setNetworkPage((p) => Math.max(1, p - 1))
  }

  function handleNextPage() {
    setNetworkPage((p) => Math.min(totalPages, p + 1))
  }

  // ── Title ───────────────────────────────────────────────────────────────────

  const title = mode === 'network'
    ? 'Órdenes de mi red'
    : isAdmin
      ? 'Todas las Órdenes'
      : 'Mis Órdenes'

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen pb-28" style={{ backgroundColor: '#F2F4F9' }} data-testid="pedidos-container">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <h1
          className="text-2xl font-semibold"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {title}
        </h1>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors"
          style={{
            backgroundColor: showFilters ? '#062A63' : '#FFFFFF',
            color: showFilters ? '#FFFFFF' : '#062A63',
            border: '1px solid #EAECF0',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          <SlidersHorizontal size={14} />
          Filtros
        </button>
      </div>

      <div className="px-5">
        {/* Segmented control — mode switcher */}
        <div
          className="flex rounded-full p-1 mb-4 max-w-xs mx-auto"
          style={{ backgroundColor: '#F2F4F9', border: '1px solid #EAECF0' }}
        >
          <button
            onClick={() => handleModeChange('own')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              mode === 'own' ? 'bg-white shadow-sm' : ''
            }`}
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: mode === 'own' ? '#062A63' : '#9CA3AF',
              boxShadow: mode === 'own' ? '0 1px 3px rgba(0,0,0,0.06)' : undefined,
            }}
            data-testid="pedidos-segment-own"
          >
            Mis órdenes
          </button>
          <button
            onClick={() => handleModeChange('network')}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              mode === 'network' ? 'bg-white shadow-sm' : ''
            }`}
            style={{
              fontFamily: 'Poppins, sans-serif',
              color: mode === 'network' ? '#062A63' : '#9CA3AF',
              boxShadow: mode === 'network' ? '0 1px 3px rgba(0,0,0,0.06)' : undefined,
            }}
            data-testid="pedidos-segment-network"
          >
            Órdenes de mi red
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <FilterPanel
            filter={filter}
            onApply={handleApplyFilter}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Active chips */}
        <ActiveFilterChips filter={filter} onRemove={handleRemoveChip} />

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-[16px] h-32 animate-pulse"
                style={{ border: '1px solid #EAECF0' }}
              />
            ))}
          </div>
        ) : isError ? (
          <div
            className="rounded-[16px] p-5 text-center"
            style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}
          >
            <p className="text-sm font-medium text-red-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Error al cargar órdenes
            </p>
          </div>
        ) : orders.length === 0 ? (
          mode === 'network' ? <NetworkEmptyState /> : <EmptyState />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {orders.map((order) => {
                const key = order.id
                const buyerName = isNetworkOrder(order)
                  ? `${order.buyer_name} ${order.buyer_apellidos ?? ''}`.trim()
                  : undefined
                const treeLevel = isNetworkOrder(order) ? order.tree_level : undefined
                return (
                  <OrderCard
                    key={key}
                    order={order}
                    profile={profile}
                    showBuyerInfo={mode === 'network'}
                    buyerName={buyerName}
                    treeLevel={treeLevel}
                  />
                )
              })}
            </div>

            {/* Pagination — network mode only */}
            {mode === 'network' && total > 20 && (
              <div className="flex items-center justify-center gap-3 mt-6 mb-4">
                <button
                  onClick={handlePrevPage}
                  disabled={networkPage <= 1}
                  className="rounded-full px-4 py-2 text-xs font-medium transition-opacity"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    backgroundColor: networkPage <= 1 ? '#F3F4F6' : '#062A63',
                    color: networkPage <= 1 ? '#9CA3AF' : '#FFFFFF',
                    opacity: networkPage <= 1 ? 0.5 : 1,
                  }}
                >
                  <ChevronLeft size={14} className="inline-block mr-1" />
                  Anterior
                </button>
                <span
                  className="text-xs font-medium"
                  style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
                >
                  Página {networkPage} de {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={networkPage >= totalPages}
                  className="rounded-full px-4 py-2 text-xs font-medium transition-opacity"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    backgroundColor: networkPage >= totalPages ? '#F3F4F6' : '#062A63',
                    color: networkPage >= totalPages ? '#9CA3AF' : '#FFFFFF',
                    opacity: networkPage >= totalPages ? 0.5 : 1,
                  }}
                >
                  Siguiente
                  <ChevronRight size={14} className="inline-block ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
