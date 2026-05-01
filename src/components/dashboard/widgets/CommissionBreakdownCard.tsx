// ─── CommissionBreakdownCard ──────────────────────────────────────────────────
// Lists commissions grouped by bono_type with formatted amounts.

import { WidgetSkeleton } from './WidgetSkeleton'
import { formatBonoType, formatAmount } from '../../../lib/formatters'
import type { BreakdownItem } from '../../../hooks/useNegocio'

interface CommissionBreakdownCardProps {
  items: BreakdownItem[]
  currency: string
  isLoading?: boolean
  className?: string
}

export function CommissionBreakdownCard({
  items,
  currency,
  isLoading,
  className = '',
}: CommissionBreakdownCardProps) {
  if (isLoading) return <WidgetSkeleton className={className} lines={4} />

  return (
    <div className={`rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5 ${className}`}>
      <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif] mb-3">
        Comisiones este mes
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          Aún no hay comisiones este mes
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.bono_type} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{formatBonoType(item.bono_type)}</span>
              <span className="text-sm font-semibold text-[#062A63]">
                {formatAmount(item.total, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
