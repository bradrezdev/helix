import type { OrderDetailItem } from '../hooks/useOrderDetail.ts'
import { formatAmount } from '../../../../lib/formatters.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  item: OrderDetailItem
  country: string | null
  isChild?: boolean
  childrenItems?: OrderDetailItem[]
}

// ─── ProductCard ──────────────────────────────────────────────────────────────

export function ProductCard({ item, country, isChild, childrenItems }: ProductCardProps) {
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

      {/* Children items (kit components) rendered as detail list inside parent card */}
      {childrenItems && childrenItems.length > 0 && (
        <div
          className="rounded-[12px] p-3 space-y-2"
          style={{ backgroundColor: '#F5F7FA' }}
        >
          <p
            className="text-xs font-semibold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            Incluye:
          </p>
          {childrenItems.map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between text-xs"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <span style={{ color: '#383A3F' }}>
                {child.product_name ?? child.product_code}
                <span className="text-gray-400"> ×{child.quantity}</span>
              </span>
              <span style={{ color: '#062A63', fontWeight: 600 }}>
                {formatAmount(child.unit_price, country)} c/u
              </span>
            </div>
          ))}
          <div
            className="flex justify-between text-xs font-semibold pt-1"
            style={{ borderTop: '1px solid #EAECF0', color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            <span>Total del paquete</span>
            <span>
              {formatAmount(
                childrenItems.reduce((sum, c) => sum + c.total_amount, 0),
                country
              )}
            </span>
          </div>
        </div>
      )}

      {/* Price row — hide for child/component items */}
      {!isChild && (
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
      )}

      {/* PV / CV badges — hide for child/component items */}
      {!isChild && (
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
      )}
    </div>
  )
}
