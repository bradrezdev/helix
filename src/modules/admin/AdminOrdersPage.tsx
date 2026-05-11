import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { useIsAdmin } from './hooks/useAdmin.ts'
import { useAdminOrders } from './hooks/useAdminOrders.ts'
import type { AdminOrder, AdminOrderFilter, AdminOrderUser } from './hooks/useAdminOrders.ts'
import { PDFDropdownButton } from '../e-commerce/pedidos/components/PDFDropdownButton.tsx'
import {
  formatOrderStatus,
  formatPaymentMethod,
  formatShippingMethod,
  formatDateTime,
  OrderStatus,
} from '../../lib/formatters'
import type { ShippingData } from '../../lib/formatters'

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20

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

const SORT_BY_OPTIONS = [
  { value: 'created_at', label: 'Fecha creación' },
  { value: 'updated_at', label: 'Fecha actualización' },
  { value: 'order_id', label: 'ID de orden' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(amount: number | null): string {
  if (amount == null) return '$—'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function resolveShippingLabel(order: AdminOrder): string {
  const shipping = order.shipping_data as ShippingData
  return formatShippingMethod(shipping, order.cedi_name ?? undefined)
}

// ─── UserTooltip ──────────────────────────────────────────────────────────────

function UserTooltip({ user }: { user: AdminOrderUser }) {
  const [visible, setVisible] = useState(false)
  const fullName = [user.name, user.apellidos].filter(Boolean).join(' ')

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setVisible((v) => !v)}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="flex items-center gap-1.5 max-w-[140px]"
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#EFF6FF' }}
        >
          <Users size={12} style={{ color: '#062A63' }} />
        </div>
        <span
          className="text-xs font-medium truncate"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {fullName || 'Desconocido'}
        </span>
      </button>

      {visible && (
        <div
          className="absolute left-0 top-full mt-2 z-50 rounded-[14px] p-3 w-56"
          style={{
            background: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(6,42,99,0.14)',
            border: '1px solid #EAECF0',
          }}
        >
          <div className="space-y-1.5">
            <TooltipRow label="Socio ID" value={String(user.user_id)} />
            <TooltipRow label="Nombre" value={fullName || '—'} />
            <TooltipRow label="País" value={user.country ?? '—'} />
            <TooltipRow label="Patrocinador" value={user.sponsor_name ?? '—'} />
            <TooltipRow
              label="Inscripción"
              value={user.enrollment_date ? formatDateTime(user.enrollment_date) : '—'}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function TooltipRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span
        className="text-[10px] w-20 shrink-0"
        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </span>
      <span
        className="text-[10px] font-medium truncate"
        style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── FilterPanel ──────────────────────────────────────────────────────────────

interface FilterPanelProps {
  filter: AdminOrderFilter
  onApply: (f: AdminOrderFilter) => void
  onClose: () => void
}

function FilterPanel({ filter, onApply, onClose }: FilterPanelProps) {
  const [draft, setDraft] = useState<AdminOrderFilter>({ ...filter })

  function update(key: keyof AdminOrderFilter, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value || undefined }))
  }

  function handleApply() {
    onApply({ ...draft, page: 0 })
    onClose()
  }

  function handleClear() {
    onApply({ sortBy: 'created_at', sortDir: 'desc', page: 0 })
    onClose()
  }

  return (
    <div
      className="rounded-[20px] p-5 mb-4"
      style={{ background: '#FFFFFF', border: '1px solid #EAECF0', boxShadow: '0 2px 12px rgba(6,42,99,0.07)' }}
    >
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FilterInput
          label="ID de orden"
          value={draft.orderId ?? ''}
          onChange={(v) => update('orderId', v)}
          placeholder="Buscar..."
        />
        <FilterInput
          label="Nombre de persona"
          value={draft.userName ?? ''}
          onChange={(v) => update('userName', v)}
          placeholder="Buscar..."
        />
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
          label="Ordenar por"
          value={draft.sortBy ?? 'created_at'}
          options={SORT_BY_OPTIONS}
          onChange={(v) => update('sortBy', v)}
        />
        <FilterSelect
          label="Dirección"
          value={draft.sortDir ?? 'desc'}
          options={[
            { value: 'desc', label: 'Más reciente primero' },
            { value: 'asc', label: 'Más antiguo primero' },
          ]}
          onChange={(v) => update('sortDir', v)}
        />
      </div>

      <p
        className="text-xs font-semibold mb-2"
        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        Fecha de creación
      </p>
      <div className="grid grid-cols-2 gap-3 mb-3">
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

      <p
        className="text-xs font-semibold mb-2"
        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        Fecha de actualización
      </p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <FilterInput
          label="Desde"
          type="date"
          value={draft.updatedFrom ?? ''}
          onChange={(v) => update('updatedFrom', v)}
        />
        <FilterInput
          label="Hasta"
          type="date"
          value={draft.updatedTo ?? ''}
          onChange={(v) => update('updatedTo', v)}
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
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <p
        className="text-[10px] mb-1"
        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </p>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-[10px] text-xs outline-none transition-colors"
        style={{
          border: '1px solid #EAECF0',
          color: '#383A3F',
          fontFamily: 'Poppins, sans-serif',
          backgroundColor: '#F8FAFC',
        }}
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
      <p
        className="text-[10px] mb-1"
        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-[10px] text-xs outline-none"
        style={{
          border: '1px solid #EAECF0',
          color: '#383A3F',
          fontFamily: 'Poppins, sans-serif',
          backgroundColor: '#F8FAFC',
        }}
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
  filter: AdminOrderFilter
  onRemove: (key: keyof AdminOrderFilter) => void
}) {
  const chips: { key: keyof AdminOrderFilter; label: string }[] = []

  if (filter.orderId) chips.push({ key: 'orderId', label: `ID: ${filter.orderId}` })
  if (filter.userName) chips.push({ key: 'userName', label: `Nombre: ${filter.userName}` })
  if (filter.status) chips.push({ key: 'status', label: formatOrderStatus(filter.status) })
  if (filter.paymentMethod)
    chips.push({ key: 'paymentMethod', label: formatPaymentMethod(filter.paymentMethod) })
  if (filter.shippingType)
    chips.push({ key: 'shippingType', label: `Envío: ${filter.shippingType}` })
  if (filter.dateFrom) chips.push({ key: 'dateFrom', label: `Desde: ${filter.dateFrom}` })
  if (filter.dateTo) chips.push({ key: 'dateTo', label: `Hasta: ${filter.dateTo}` })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map(({ key, label }) => (
        <span
          key={key}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: '#EFF6FF',
            color: '#062A63',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          {label}
          <button
            onClick={() => onRemove(key)}
            className="flex items-center justify-center w-3.5 h-3.5 rounded-full transition-colors hover:bg-blue-100"
          >
            <X size={10} style={{ color: '#062A63' }} />
          </button>
        </span>
      ))}
    </div>
  )
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function AdminOrderCard({ order }: { order: AdminOrder }) {
  const navigate = useNavigate()
  const items = order.items ?? []
  const statusLabel = formatOrderStatus(order.status)
  const paymentLabel = formatPaymentMethod(order.payment_method)
  const shippingLabel = resolveShippingLabel(order)

  const pdfProps = {
    order: {
      order_id: order.order_id,
      created_at: order.created_at,
      status: order.status,
      payment_method: order.payment_method,
      shipping_data: order.shipping_data,
      total_amount: order.total_amount,
      pv: order.pv,
      cv: order.cv,
    },
    items: items.map((item) => ({
      product_name: item.product_name,
      product_code: item.product_code,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_amount: item.total_amount,
    })),
    user: {
      name: order.user.name,
      apellidos: order.user.apellidos,
      user_id: order.user.user_id,
    },
  }

  return (
    <div
      className="bg-white rounded-[20px] p-4"
      style={{ border: '1px solid #EAECF0', boxShadow: '0 1px 6px rgba(6,42,99,0.05)' }}
    >
      {/* Top row: user + order id + status */}
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <UserTooltip user={order.user} />
          <span
            className="text-xs"
            style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
          >
            Socio #{order.user.user_id}
          </span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Order fields grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
        <FieldRow label="Orden #" value={order.order_id != null ? String(Number(order.order_id)) : '—'} />
        <FieldRow label="Fecha" value={formatDateTime(order.created_at)} />
        <FieldRow label="Actualizado" value={formatDateTime(order.updated_at)} />
        <FieldRow label="Pago" value={paymentLabel} />
        <FieldRow label="Envío" value={shippingLabel} />
        <FieldRow label="Total" value={formatMXN(order.total_amount)} accent />
      </div>

      {/* Product summary */}
      {items.length > 0 && (
        <div
          className="rounded-[12px] p-3 mb-3"
          style={{ backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}
        >
          <p
            className="text-[10px] font-semibold uppercase mb-2"
            style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
          >
            Productos ({items.length})
          </p>
          <div className="space-y-1">
            {items.map((item, idx) => (
              <p
                key={idx}
                className="text-xs"
                style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
              >
                {item.product_name ?? item.product_code} ×{item.quantity} ={' '}
                {formatMXN(item.total_amount)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => navigate({ to: '/ordenes/$orderId', params: { orderId: order.id } })}
          className="px-4 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80"
          style={{
            color: '#0CBCE5',
            border: '1px solid #0CBCE5',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Ver detalles
        </button>
        <PDFDropdownButton {...pdfProps} />
      </div>
    </div>
  )
}

function FieldRow({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <p
        className="text-[10px]"
        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </p>
      <p
        className="text-xs font-medium truncate"
        style={{
          color: accent ? '#062A63' : '#383A3F',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        {value}
      </p>
    </div>
  )
}

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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#D97706' },
  paid: { bg: '#DCFCE7', text: '#16A34A' },
  cancelled: { bg: '#FEF2F2', text: '#EF4444' },
  en_proceso: { bg: '#EFF6FF', text: '#2563EB' },
  reembolsado: { bg: '#F5F3FF', text: '#7C3AED' },
  default: { bg: '#F3F4F6', text: '#9CA3AF' },
}

// ─── PaginationBar ────────────────────────────────────────────────────────────

function PaginationBar({
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <button
        onClick={onPrev}
        disabled={page === 0}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white disabled:opacity-30"
        style={{ border: '1px solid #EAECF0' }}
      >
        <ChevronLeft size={16} style={{ color: '#062A63' }} />
      </button>
      <span
        className="text-sm font-medium"
        style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
      >
        Página {page + 1} de {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page >= totalPages - 1}
        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white disabled:opacity-30"
        style={{ border: '1px solid #EAECF0' }}
      >
        <ChevronRight size={16} style={{ color: '#062A63' }} />
      </button>
    </div>
  )
}

// ─── AdminOrdersPage ──────────────────────────────────────────────────────────

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const isAdmin = useIsAdmin()

  const [showFilters, setShowFilters] = useState(false)
  const [filter, setFilter] = useState<AdminOrderFilter>({
    sortBy: 'created_at',
    sortDir: 'desc',
    page: 0,
    pageSize: PAGE_SIZE,
  })

  const { orders, loading, error, total } = useAdminOrders(filter)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Non-admin redirect
  if (isAdmin === false) {
    void navigate({ to: '/ordenes' })
    return null
  }

  function handleSetFilter(newFilter: AdminOrderFilter) {
    setFilter({ ...newFilter, pageSize: PAGE_SIZE })
  }

  function handleRemoveChip(key: keyof AdminOrderFilter) {
    setFilter((prev) => {
      const updated = { ...prev }
      delete updated[key]
      return { ...updated, page: 0 }
    })
  }

  function handlePrev() {
    setFilter((prev) => ({ ...prev, page: Math.max(0, (prev.page ?? 0) - 1) }))
  }

  function handleNext() {
    setFilter((prev) => ({
      ...prev,
      page: Math.min(totalPages - 1, (prev.page ?? 0) + 1),
    }))
  }

  const page = filter.page ?? 0

  return (
    <main className="min-h-screen pb-28" style={{ backgroundColor: '#F2F4F9' }}>
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <h1
          className="text-2xl font-semibold"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Órdenes
        </h1>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-colors hover:opacity-80"
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
        {/* Filter panel */}
        {showFilters && (
          <FilterPanel
            filter={filter}
            onApply={handleSetFilter}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Active chips */}
        <ActiveFilterChips filter={filter} onRemove={handleRemoveChip} />

        {/* Count */}
        {!loading && (
          <p
            className="text-xs mb-3"
            style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
          >
            {total} {total === 1 ? 'orden' : 'órdenes'} encontradas
          </p>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-[20px] h-40 animate-pulse"
                style={{ border: '1px solid #EAECF0' }}
              />
            ))}
          </div>
        ) : error ? (
          <div
            className="rounded-[16px] p-5 text-center"
            style={{ background: '#FEF2F2', border: '1px solid #FCA5A5' }}
          >
            <p
              className="text-sm font-medium"
              style={{ color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}
            >
              Error al cargar órdenes: {error}
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p
              className="text-sm font-medium"
              style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
            >
              No se encontraron órdenes
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <AdminOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}

        <PaginationBar
          page={page}
          totalPages={totalPages}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </div>
    </main>
  )
}
