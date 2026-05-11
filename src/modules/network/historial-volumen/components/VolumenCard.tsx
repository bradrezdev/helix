// ─── VolumenCard ───────────────────────────────────────────────────────────────
// Period volume metrics card with expandable level-by-level breakdown.
// Shows PV, CV (MXN), and VG for one period. Click to expand and see
// per-level contribution (Nivel, Socios, PV, CV, VG).
//
// States: collapsed (default), expanded+loading (skeleton),
// expanded+empty (info), expanded+data (table).

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { PeriodoVolumen } from '../hooks/usePeriodos.ts'
import { useComisionesNivel } from '../../../finances/comisiones/hooks/useComisionesNivel.ts'
import { cn } from '../../../../lib/utils.ts'

interface VolumenCardProps {
  periodo: PeriodoVolumen
  userId: string | undefined
  isActive?: boolean
}

const STATUS_LABEL: Record<PeriodoVolumen['status'], string> = {
  active: 'Activo',
  closed: 'Cerrado',
}

/** Format number with commas, no decimals: 1250 → "1,250" */
function formatInt(n: number): string {
  return new Intl.NumberFormat('es-MX').format(n)
}

/** Format as MXN currency: 5200 → "$5,200.00" */
function formatMXN(n: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(n)
}

/** Format date range: "1 May — 31 May 2026" */
function formatDateRange(start: string, end: string): string {
  const fmt = new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${fmt.format(new Date(start))} — ${fmt.format(new Date(end))}`
}

export function VolumenCard({
  periodo,
  userId,
  isActive = false,
}: VolumenCardProps) {
  const [expanded, setExpanded] = useState(false)
  const statusLabel = STATUS_LABEL[periodo.status]

  // Fetch level data lazily — only when card is expanded
  const { data: niveles = [], isLoading: nivelesLoading } = useComisionesNivel({
    userId: expanded ? userId : undefined,
    month: periodo.period_month,
    year: periodo.period_year,
  })

  // Totals for footer row
  const totals = niveles.reduce(
    (acc, n) => ({
      socios: acc.socios + n.total_socios,
      pv: acc.pv + n.total_pv,
      cv: acc.cv + n.total_cv,
    }),
    { socios: 0, pv: 0, cv: 0 },
  )

  return (
    <div
      className={cn(
        'rounded-[24px] bg-white shadow-[0_4px_24px_rgba(6,42,99,0.07)]',
        isActive && 'border-l-[3px] border-l-[#0CBCE5]',
      )}
    >
      {/* ── Header (clickable toggle) ── */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full p-4 text-left cursor-pointer"
        aria-expanded={expanded}
      >
        {/* Top row: period name + chevron + status badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <h3
              className="text-lg font-semibold text-[#062A63] truncate"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {periodo.period_name}
            </h3>
            <ChevronDown
              size={18}
              className={cn(
                'shrink-0 text-[#9CA3AF] transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </div>
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
              periodo.status === 'active'
                ? 'bg-[rgba(12,188,229,0.10)] text-[#0CBCE5]'
                : 'bg-[#F2F4F9] text-[#9CA3AF]',
            )}
          >
            {statusLabel}
          </span>
        </div>

        {/* Date range */}
        <p className="mt-1 text-xs text-[#9CA3AF]">
          {formatDateRange(periodo.start_date, periodo.end_date)}
        </p>

        {/* Divider */}
        <div className="my-3 border-t border-[#EAECF0]" />

        {/* Metric grid: 2 cols mobile, 3 cols sm+ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* PV Personal */}
          <div>
            <p className="text-xs text-[#9CA3AF]">PV Personal</p>
            <p className="text-lg font-bold text-[#062A63]">
              {formatInt(periodo.personal_pv)}
            </p>
          </div>

          {/* CV Personal */}
          <div>
            <p className="text-xs text-[#9CA3AF]">CV Personal</p>
            <p className="text-lg font-bold text-[#062A63]">
              {formatMXN(periodo.personal_cv)}
            </p>
          </div>

          {/* VG Grupal */}
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs text-[#9CA3AF]">VG Grupal</p>
            <p className="text-lg font-bold text-[#062A63]">
              {formatInt(periodo.group_vg)}
            </p>
            <p className="text-[10px] italic text-[#9CA3AF]">valor actual</p>
          </div>
        </div>
      </button>

      {/* ── Expanded section: level-by-level breakdown ── */}
      {expanded && (
        <div className="border-t border-[#EAECF0]">
          {/* Loading state */}
          {nivelesLoading && (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 bg-[#F2F4F9] rounded-lg animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!nivelesLoading && niveles.length === 0 && (
            <div className="p-6 text-center">
              <p
                className="text-sm text-[#9CA3AF]"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Sin datos de volumen por nivel para este periodo.
              </p>
            </div>
          )}

          {/* Data table */}
          {!nivelesLoading && niveles.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#EAECF0] text-[#062A63] text-xs uppercase tracking-wider">
                    <th className="p-3 pl-4 text-left font-semibold">Nivel</th>
                    <th className="p-3 text-right font-semibold">Socios</th>
                    <th className="p-3 text-right font-semibold">PV</th>
                    <th className="p-3 text-right font-semibold">CV</th>
                    <th className="p-3 pr-4 text-right font-semibold">VG</th>
                  </tr>
                </thead>
                <tbody>
                  {niveles.map((nivel) => (
                    <tr
                      key={nivel.level}
                      className="border-b border-[#F2F4F9] last:border-b-0 text-[#383A3F] hover:bg-[#F2F4F9]/50 transition-colors"
                    >
                      <td className="p-3 pl-4 font-medium text-[#062A63]">
                        Nivel {nivel.level}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {nivel.total_socios}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {formatInt(nivel.total_pv)}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {formatInt(nivel.total_cv)}
                      </td>
                      <td className="p-3 pr-4 text-right font-semibold text-[#062A63] tabular-nums">
                        {formatInt(nivel.total_pv)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Footer: totals row */}
                <tfoot>
                  <tr className="border-t-2 border-[#EAECF0] bg-[#F8F9FC] text-[#062A63] font-semibold text-sm">
                    <td className="p-3 pl-4">Total</td>
                    <td className="p-3 text-right tabular-nums">
                      {totals.socios}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {formatInt(totals.pv)}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {formatInt(totals.cv)}
                    </td>
                    <td className="p-3 pr-4 text-right tabular-nums">
                      {formatInt(totals.pv)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
