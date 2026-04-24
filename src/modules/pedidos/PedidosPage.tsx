import { useState } from 'react'
import { ChevronRight, ChevronDown, PackageOpen, Search } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { usePedidos } from '../../hooks/usePedidos'
import type { OrderWithItems } from '../../hooks/usePedidos'
import type { Enums } from '../../lib/database.types'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = Enums<'order_status'>

type FilterTab = 'todos' | OrderStatus

// ─── Constants ────────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'pending', label: 'Pendiente' },
  { key: 'paid', label: 'Completado' },
  { key: 'cancelled', label: 'Cancelado' },
]

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; bg: string; text: string }
> = {
  pending: { label: 'Pendiente', bg: '#FEF3C7', text: '#D97706' },
  paid: { label: 'Completado', bg: '#DCFCE7', text: '#16A34A' },
  cancelled: { label: 'Cancelado', bg: '#FEF2F2', text: '#EF4444' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

function formatMXN(amount: number | null): string {
  if (amount == null) return '$—'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function truncateId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus | null }) {
  const cfg = status ? STATUS_CONFIG[status] : STATUS_CONFIG.pending
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text, fontFamily: 'Poppins, sans-serif' }}
    >
      {cfg.label}
    </span>
  )
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: OrderWithItems }) {
  const [expanded, setExpanded] = useState(false)
  const items = order.order_items ?? []

  return (
    <div
      className="bg-white rounded-[32px] border overflow-hidden"
      style={{ borderColor: '#EAECF0' }}
    >
      {/* Summary row */}
      <button
        className="w-full px-5 py-4 flex items-center gap-3 text-left transition-colors hover:bg-gray-50"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Order info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-semibold"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              {truncateId(order.id)}
            </span>
            <StatusBadge status={order.status ?? null} />
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span
              className="text-xs"
              style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
            >
              {formatDate(order.created_at)}
            </span>
            <span
              className="text-xs"
              style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
            >
              {items.length} {items.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
        </div>

        {/* Amount + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-sm font-semibold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            {formatMXN(order.total_amount)}
          </span>
          {expanded ? (
            <ChevronDown size={16} style={{ color: '#9CA3AF' }} />
          ) : (
            <ChevronRight size={16} style={{ color: '#9CA3AF' }} />
          )}
        </div>
      </button>

      {/* Ver detalles button */}
      <div className="px-5 pb-3 flex justify-end" style={{ borderTop: '1px solid #EAECF0' }}>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
          style={{
            color: '#0CBCE5',
            border: '1px solid #0CBCE5',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          Ver detalles
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && items.length > 0 && (
        <div style={{ borderTop: '1px solid #EAECF0' }}>
          {/* Table header */}
          <div
            className="grid px-5 py-2"
            style={{
              gridTemplateColumns: '1fr 60px 90px 90px',
              backgroundColor: '#F8FAFC',
            }}
          >
            {['Producto', 'Cant.', 'P. Unit.', 'Subtotal'].map((h) => (
              <span
                key={h}
                className="text-xs font-medium"
                style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {items.map((item) => (
            <div
              key={item.id}
              className="grid px-5 py-3 items-center"
              style={{
                gridTemplateColumns: '1fr 60px 90px 90px',
                borderTop: '1px solid #F1F5F9',
              }}
            >
              <span
                className="text-xs truncate pr-2"
                style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                title={item.product_name ?? item.product_code}
              >
                {item.product_name ?? item.product_code}
              </span>
              <span
                className="text-xs"
                style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
              >
                {item.quantity}
              </span>
              <span
                className="text-xs"
                style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
              >
                {formatMXN(item.unit_price)}
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                {formatMXN(item.total_amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {expanded && items.length === 0 && (
        <div
          className="px-5 py-4 text-xs text-center"
          style={{ borderTop: '1px solid #EAECF0', color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
        >
          Sin productos registrados
        </div>
      )}
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
        No tienes pedidos aún
      </p>
    </div>
  )
}

// ─── PedidosPage ──────────────────────────────────────────────────────────────

export function PedidosPage() {
  const { user } = useAuth()
  const { data: orders = [], isLoading } = usePedidos(user?.id ?? '')
  const [activeTab, setActiveTab] = useState<FilterTab>('todos')
  const [search, setSearch] = useState('')

  const filtered = orders
    .filter((o) => activeTab === 'todos' || o.status === activeTab)
    .filter((o) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        o.id.toLowerCase().includes(q) ||
        (o.order_items ?? []).some(
          (i) =>
            (i.product_name ?? '').toLowerCase().includes(q) ||
            i.product_code.toLowerCase().includes(q)
        )
      )
    })

  return (
    <main
      className="min-h-screen pb-28"
      style={{ backgroundColor: '#F2F4F9' }}
    >
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <h1
          className="text-2xl font-semibold"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Mis Pedidos
        </h1>
      </div>

      {/* Search bar */}
      <div className="px-5 mb-4">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full"
          style={{ background: '#fff', border: '1px solid #EAECF0' }}
        >
          <Search size={15} style={{ color: '#9CA3AF', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar pedido..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="px-5 mb-5">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map(({ key, label }) => {
            const isActive = activeTab === key
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: isActive ? '#062A63' : '#fff',
                  color: isActive ? '#fff' : '#9CA3AF',
                  border: isActive ? 'none' : '1px solid #EAECF0',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 flex flex-col gap-3">
        {isLoading ? (
          // Skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-[32px] border h-20 animate-pulse"
              style={{ borderColor: '#EAECF0' }}
            />
          ))
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </div>
    </main>
  )
}
