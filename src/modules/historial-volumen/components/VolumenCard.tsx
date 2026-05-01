// ─── VolumenCard ───────────────────────────────────────────────────────────────
// Period volume metrics card. Shows PV, CV (MXN), and VG for one period.
// Active period gets a cyan left border accent.

import type { PeriodoVolumen } from '../../../hooks/usePeriodos'

interface VolumenCardProps {
  periodo: PeriodoVolumen
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
  const fmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${fmt.format(new Date(start))} — ${fmt.format(new Date(end))}`
}

export function VolumenCard({ periodo, isActive = false }: VolumenCardProps) {
  const statusLabel = STATUS_LABEL[periodo.status]

  return (
    <div
      className={`rounded-[24px] bg-white shadow-[0_4px_24px_rgba(6,42,99,0.07)] p-4 ${
        isActive ? 'border-l-[3px] border-l-[#0CBCE5]' : ''
      }`}
    >
      {/* ── Top row: period name + status badge ── */}
      <div className="flex items-center justify-between">
        <h3
          className="text-lg font-semibold text-[#062A63]"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {periodo.period_name}
        </h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            periodo.status === 'active'
              ? 'bg-[rgba(12,188,229,0.10)] text-[#0CBCE5]'
              : 'bg-[#F2F4F9] text-[#9CA3AF]'
          }`}
        >
          {statusLabel}
        </span>
      </div>

      {/* ── Date range ── */}
      <p className="mt-1 text-xs text-[#9CA3AF]">
        {formatDateRange(periodo.start_date, periodo.end_date)}
      </p>

      {/* ── Divider ── */}
      <div className="my-3 border-t border-[#EAECF0]" />

      {/* ── Metric grid: 2 cols mobile, 3 cols sm+ ── */}
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
    </div>
  )
}
