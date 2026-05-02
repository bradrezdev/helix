// ─── SocioRow ──────────────────────────────────────────────────────────────────
// Table row for a single socio within a commission level.
// Dual-mode: header row (isHeader) renders column labels; data rows render values.
//
// Columns: User ID | Nombre + Apellido | PV | CV | Comisión

import { cn } from '../../../lib/utils'
import { formatAmount } from '../../../lib/formatters'
import type { SocioNivel } from '../../../hooks/useSociosNivel'

interface SocioRowProps {
  socio: SocioNivel
  isHeader?: boolean
}

// Header labels (Spanish)
const HEADERS = ['User ID', 'Nombre', 'PV', 'CV', 'Comisión']

export default function SocioRow({ socio, isHeader = false }: SocioRowProps) {
  if (isHeader) {
    return (
      <div
        className={cn(
          'grid grid-cols-[100px_1fr_80px_120px_120px] items-center gap-2',
          'bg-[#F2F4F9] text-[#9CA3AF] text-xs font-medium uppercase',
          'py-2.5 px-4',
        )}
        style={{ fontFamily: 'Poppins, sans-serif' }}
        role="row"
      >
        {HEADERS.map((label) => (
          <div key={label} role="columnheader">
            {label}
          </div>
        ))}
      </div>
    )
  }

  const fullName = [socio.name, socio.apellidos].filter(Boolean).join(' ') || 'Usuario desconocido'

  return (
    <div
      className={cn(
        'grid grid-cols-[100px_1fr_80px_120px_120px] items-center gap-2',
        'py-2.5 px-4 border-b border-[#EAECF0] last:border-0',
      )}
      style={{ fontFamily: 'Poppins, sans-serif' }}
      role="row"
      data-testid={`socio-row-${socio.user_id}`}
    >
      {/* User ID — cyan monospace */}
      <span className="text-[#0CBCE5] font-mono text-xs" role="cell">
        #{socio.user_id}
      </span>

      {/* Name */}
      <span className="text-sm text-[#383A3F] font-medium truncate" role="cell">
        {fullName}
      </span>

      {/* PV — comma-formatted */}
      <span className="text-sm text-[#383A3F]" role="cell">
        {socio.pv.toLocaleString('es-MX')}
      </span>

      {/* CV — volumen */}
      <span className="text-sm text-[#383A3F]" role="cell">
        {socio.cv.toLocaleString('es-MX')}
      </span>

      {/* Comisión — bold primary */}
      <span className="text-sm font-semibold text-[#062A63]" role="cell">
        {formatAmount(socio.amount, 'MXN')}
      </span>
    </div>
  )
}
