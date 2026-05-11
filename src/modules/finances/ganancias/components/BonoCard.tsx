// ─── BonoCard ──────────────────────────────────────────────────────────────────
// Bento-style card displaying aggregate commission data for a single bonus type.
// Features a colored left accent bar for instant visual identification.
//
// Intent: Distribuidor ONANO viendo desglose de ganancias por tipo de bono.
// Feel: Preciso, confiable — como estado de cuenta premium.
//
// Palette: ONANO colors via style prop (project convention: hex arbitrary values).
// Depth: Subtle Apple-style shadow + active scale press.
// Typography: Poppins — bold for amount, medium for label, xs for metadata.

import { DollarSign } from 'lucide-react'
import type { BonoGroup } from '../utils.ts'
import { getBonoIcon } from '../constants.ts'

interface BonoCardProps {
  group: BonoGroup
  color: string
  onClick: () => void
}

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

export default function BonoCard({ group, color, onClick }: BonoCardProps) {
  const Icon = getBonoIcon(group.key) ?? DollarSign

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="relative overflow-hidden bg-white rounded-[24px] p-5 shadow-[0_4px_24px_rgba(6,42,99,0.07)] cursor-pointer active:scale-[0.98] transition-transform"
      style={{ fontFamily: 'Poppins, sans-serif' }}
      data-testid={`bono-card-${group.key}`}
    >
      {/* Left accent bar — colored by bono_type */}
      <div
        className="absolute left-0 top-0 w-2 h-full rounded-l-[24px]"
        style={{ backgroundColor: color }}
      />

      <div className="ml-2">
        {/* Header: icon + label + percentage badge */}
        <div className="flex items-center gap-2 mb-3">
          {/* Icon circle with 8% opacity background */}
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
            style={{ backgroundColor: `${color}14` }}
          >
            <Icon size={16} style={{ color }} />
          </div>

          {/* Bonus type label */}
          <span
            className="text-sm font-medium capitalize flex-1"
            style={{ color: '#383A3F' }}
          >
            {group.key.replace(/_/g, ' ')}
          </span>

          {/* Percentage badge */}
          {group.percentage > 0 && (
            <span
              className="text-xs rounded-full px-2 py-0.5 font-medium shrink-0"
              style={{
                backgroundColor: 'rgba(12,188,229,0.10)',
                color: '#0CBCE5',
              }}
            >
              {group.percentage}%
            </span>
          )}
        </div>

        {/* Amount — large, bold, primary color */}
        <p className="text-2xl font-bold" style={{ color: '#062A63' }} data-testid={`bono-amount-${group.key}`}>
          {currency.format(group.total)}
        </p>

        {/* Transaction count — subtle metadata */}
        <p className="text-xs mt-2" style={{ color: '#9CA3AF' }}>
          {group.count} {group.count === 1 ? 'transacción' : 'transacciones'}
        </p>
      </div>
    </div>
  )
}
