// ─── NivelAccordion ────────────────────────────────────────────────────────────
// Expandable card for a single commission level.
// Header shows level summary (socio count, PV, CV total).
// Body lists individual commissions with Bono | Origen | PV | CV | % | Ganancia.
// Active left border (#0CBCE5) when open.
//
// Intent: Distribuidor ONANO revisando comisiones por nivel.
// Feel: Preciso como reporte financiero — cada comisión rastreable.

import { ChevronDown } from 'lucide-react'
import { cn } from '../../../../lib/utils.ts'
import { formatBonoType, formatCurrency } from '../../../../lib/formatters.ts'
import type { ComisionNivel } from '../hooks/useComisionesNivel.ts'
import type { ComisionNivelSocio } from '../hooks/useComisionesNivelSocios.ts'

interface NivelAccordionProps {
  nivel: ComisionNivel
  expanded: boolean
  onToggle: () => void
  comisiones: ComisionNivelSocio[]
  isLoadingComisiones: boolean
}

// ─── Loading skeleton for expanded body ─────────────────────────────────────────

function BodySkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-10 animate-pulse bg-[#F2F4F9] rounded-[12px]"
        />
      ))}
    </div>
  )
}

// ─── Table header row ───────────────────────────────────────────────────────────

function TableHeader() {
  const cols = ['Bono', 'Origen', 'PV', 'CV', '%', 'Ganancia']
  return (
    <div
      className="grid grid-cols-[100px_1fr_80px_80px_70px_120px] items-center gap-2 bg-[#F2F4F9] text-[#9CA3AF] text-xs font-medium uppercase py-2.5 px-4"
      style={{ fontFamily: 'Poppins, sans-serif' }}
      role="row"
    >
      {cols.map((label) => (
        <div key={label} role="columnheader" className={label === 'Ganancia' ? 'text-right' : ''}>
          {label}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function NivelAccordion({
  nivel,
  expanded,
  onToggle,
  comisiones,
  isLoadingComisiones,
}: NivelAccordionProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)] overflow-hidden',
        expanded && 'border-l-[3px] border-l-[#0CBCE5]',
      )}
      data-testid={`nivel-accordion-${nivel.level}`}
    >
      {/* ── Header (clickable) ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 cursor-pointer text-left"
        style={{ fontFamily: 'Poppins, sans-serif' }}
        aria-expanded={expanded}
        data-testid={`nivel-header-${nivel.level}`}
      >
        <div className="flex items-center gap-4 text-sm">
          {/* Level number */}
          <span className="font-bold text-[#062A63]">
            Nivel {nivel.level}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0]">—</span>

          {/* Socios count */}
          <span className="text-[#383A3F]" data-testid={`nivel-count-${nivel.level}`}>
            {nivel.total_socios} {nivel.total_socios === 1 ? 'socio' : 'socios'}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0]">—</span>

          {/* PV total */}
          <span className="text-[#383A3F]">
            PV: {nivel.total_pv.toLocaleString('es-MX')}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0]">—</span>

          {/* CV total */}
          <span className="text-[#383A3F]">
            CV: {nivel.total_cv.toLocaleString('es-MX')}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0]">—</span>

          {/* Total amount */}
          <span className="font-semibold text-[#062A63]">
            {formatCurrency(nivel.total_amount, 'MXN')}
          </span>
        </div>

        {/* Chevron */}
        <ChevronDown
          size={20}
          color="#062A63"
          className={cn(
            'shrink-0 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {/* ── Body (conditional) ── */}
      {expanded && (
        <div className="border-t border-[#EAECF0] overflow-x-auto">
          {isLoadingComisiones ? (
            <BodySkeleton />
          ) : comisiones.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#9CA3AF]">
              Sin comisiones en este nivel para el periodo seleccionado.
            </div>
          ) : (
            <div role="table" aria-label={`Comisiones del nivel ${nivel.level}`}>
              <TableHeader />
              {comisiones.map((c, idx) => (
                <div
                  key={`${c.socio_user_id}-${c.bono_type}-${c.source_order_code}-${idx}`}
                  className="grid grid-cols-[100px_1fr_80px_80px_70px_120px] items-center gap-2 py-2.5 px-4 border-b border-[#EAECF0] last:border-0 text-sm"
                  style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                  role="row"
                >
                  {/* Bono type */}
                  <span className="text-xs font-medium text-[#0CBCE5]" role="cell">
                    {formatBonoType(c.bono_type)}
                  </span>

                  {/* Origen — full name */}
                  <span className="truncate text-sm" role="cell" title={c.socio_name}>
                    {c.socio_name}
                  </span>

                  {/* PV */}
                  <span className="text-sm" role="cell">
                    {c.pv.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>

                  {/* CV */}
                  <span className="text-sm" role="cell">
                    {c.cv.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>

                  {/* % */}
                  <span className="text-xs text-[#9CA3AF]" role="cell">
                    {c.percentage != null ? `${c.percentage.toFixed(1)}%` : '—'}
                  </span>

                  {/* Ganancia */}
                  <span className="text-right font-semibold text-[#062A63]" role="cell">
                    {formatCurrency(c.ganancia, c.currency)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
