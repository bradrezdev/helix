import type { OrderDetailItem } from '../hooks/useOrderDetail.ts'
import { formatAmount } from '../../../../lib/formatters.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  item: OrderDetailItem
  country: string | null
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

export function ProductCard({ item, country }: ProductCardProps) {
  return (
    <div
      className="bg-white rounded-[16px] shadow-sm p-4 space-y-2"
      style={{ border: '1px solid #EAECF0' }}
    >
      {/* Top row: name + quantity badge */}
      <div className="flex items-start justify-between gap-2">
        <p
          className="text-sm font-semibold flex-1 min-w-0"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {item.product_name ?? item.product_code}
        </p>
        <span
          className="shrink-0 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: '#E0F9FF',
            color: '#0CBCE5',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          ×{item.quantity}
        </span>
      </div>

      {/* Size row — omit if cantidad is null */}
      {item.cantidad && (
        <p
          className="text-xs"
          style={{ color: 'rgba(6,42,99,0.50)', fontFamily: 'Poppins, sans-serif' }}
        >
          {item.cantidad}
        </p>
      )}

      {/* Price row */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs"
          style={{ color: 'rgba(6,42,99,0.50)', fontFamily: 'Poppins, sans-serif' }}
        >
          {formatAmount(item.unit_price, country)} c/u
        </span>
        <span
          className="text-sm font-semibold"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {formatAmount(item.total_amount, country)}
        </span>
      </div>

      {/* PV / CV badges */}
      <div className="flex items-center gap-2">
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: '#E0F9FF',
            color: '#0CBCE5',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          PV: {item.pv}
        </span>
        <span
          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: '#E0F9FF',
            color: '#0CBCE5',
            fontFamily: 'Poppins, sans-serif',
          }}
        >
          CV: {item.cv}
        </span>
      </div>
    </div>
  )
}
