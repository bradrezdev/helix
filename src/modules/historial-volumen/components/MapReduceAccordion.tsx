// ─── MapReduceAccordion ────────────────────────────────────────────────
// Expandable card for a single volume level from MapReduce data.
// Header shows level summary (socio count, Starter CV, Recompra CV).
// Body shows member detail table with PV and CV columns.

import { ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/utils'
import { formatAmount } from '../../../lib/formatters'
import type { VolumeRow } from '../../../hooks/useVolumeAudit'

interface MapReduceAccordionProps {
  level: number
  socios: VolumeRow[]
  expanded: boolean
  onToggle: () => void
}

/** Integer with thousands separator: 1250 → "1,250" */
function fmtInt(n: number): string {
  return new Intl.NumberFormat('es-MX').format(n)
}

export function MapReduceAccordion({
  level,
  socios,
  expanded,
  onToggle,
}: MapReduceAccordionProps) {
  const totalSocios = socios.length
  const totalStarterCV = socios.reduce((s, r) => s + r.starter_kit_cv, 0)
  const totalRecompraCV = socios.reduce((s, r) => s + r.recompra_cv, 0)

  return (
    <div
      className={cn(
        'bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)] overflow-hidden',
        expanded && 'border-l-[3px] border-l-[#0CBCE5]',
      )}
    >
      {/* ── Header (clickable toggle) ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 cursor-pointer text-left"
        style={{ fontFamily: 'Poppins, sans-serif' }}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 sm:gap-4 text-sm flex-wrap">
          <span className="font-bold text-[#062A63]">Nivel {level}</span>

          <span aria-hidden="true" className="text-[#EAECF0]">—</span>

          <span className="text-[#383A3F] whitespace-nowrap">
            {totalSocios} {totalSocios === 1 ? 'socio' : 'socios'}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0] hidden sm:inline">—</span>

          <span className="text-[#383A3F] whitespace-nowrap">
            Starter CV: {formatAmount(totalStarterCV, 'MXN')}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0] hidden sm:inline">—</span>

          <span className="text-[#383A3F] whitespace-nowrap">
            Recompra CV: {formatAmount(totalRecompraCV, 'MXN')}
          </span>
        </div>

        <ChevronDown
          size={20}
          color="#062A63"
          className={cn(
            'shrink-0 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {/* ── Body (table) ── */}
      {expanded && (
        <div className="border-t border-[#EAECF0] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#EAECF0] text-[#9CA3AF] text-xs uppercase tracking-wider">
                <th className="p-3 pl-4 text-left font-medium">ID</th>
                <th className="p-3 text-left font-medium">Nombre</th>
                <th className="p-3 text-right font-medium">PV Starter</th>
                <th className="p-3 text-right font-medium">PV Recompra</th>
                <th className="p-3 pr-4 text-right font-medium">CV Total</th>
              </tr>
            </thead>
            <tbody>
              {socios.map((socio) => (
                <tr
                  key={socio.user_id}
                  className="border-b border-[#F2F4F9] last:border-b-0 text-[#383A3F] hover:bg-[#F2F4F9]/50"
                >
                  <td
                    className="p-3 pl-4 text-[#062A63] font-mono text-xs"
                    title={socio.user_id}
                  >
                    {socio.user_id.slice(0, 8)}
                  </td>
                  <td className="p-3 whitespace-nowrap">{socio.user_name}</td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtInt(socio.starter_kit_pv)}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {fmtInt(socio.recompra_pv)}
                  </td>
                  <td className="p-3 pr-4 text-right font-semibold text-[#062A63] tabular-nums">
                    {formatAmount(
                      socio.starter_kit_cv + socio.recompra_cv,
                      'MXN',
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
