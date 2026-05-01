// ─── MapReduceView ─────────────────────────────────────────────────────
// Displays MapReduce volume data grouped by level with month/year selector.
// States: loading (skeleton), error (retry), empty (info card), data (accordions).

import { useState, useMemo } from 'react'
import { useVolumeAudit } from '../../../hooks/useVolumeAudit'
import { MapReduceAccordion } from './MapReduceAccordion'

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function MapReduceView() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data = [], isLoading, error, refetch } = useVolumeAudit(month, year)

  // ── Group by level, sorted ascending ──
  const grouped = useMemo(() => {
    const map = new Map<number, typeof data>()
    for (const row of data) {
      const g = map.get(row.level) ?? []
      g.push(row)
      map.set(row.level, g)
    }
    return [...map.entries()].sort(([a], [b]) => a - b)
  }, [data])

  // ── Single-accordion expand ──
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null)

  const handleToggle = (level: number) => {
    setExpandedLevel((prev) => (prev === level ? null : level))
  }

  // ── Year range: current -5 to current +1 ──
  const years = useMemo(() => {
    const y = now.getFullYear()
    return Array.from({ length: 7 }, (_, i) => y - 5 + i)
  }, [])

  // ── Shared styles ──
  const fontFamily: React.CSSProperties = { fontFamily: 'Poppins, sans-serif' }
  const selectClass =
    'rounded-[12px] border border-[#EAECF0] bg-white px-3 py-2 text-sm text-[#383A3F] outline-none focus:border-[#062A63] w-full'

  return (
    <div className="mt-4 space-y-4">
      {/* ── Month / Year selector ── */}
      <div className="flex gap-3 max-w-sm">
        <div className="flex-1">
          <label className="block text-xs text-[#9CA3AF] mb-1" style={fontFamily}>
            Mes
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={selectClass}
            style={fontFamily}
          >
            {MONTHS.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-[#9CA3AF] mb-1" style={fontFamily}>
            Año
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className={selectClass}
            style={fontFamily}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Loading state ── */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-[24px] bg-[#F2F4F9] h-16 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* ── Error state ── */}
      {!isLoading && error && (
        <div className="rounded-[24px] bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">Error al cargar datos de volumen</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 px-4 py-1.5 rounded-full bg-red-600 text-white text-xs"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !error && data.length === 0 && (
        <div className="rounded-[24px] bg-[#F2F4F9] border border-[#EAECF0] p-8 text-center">
          <p className="text-sm text-[#9CA3AF]" style={fontFamily}>
            Sin datos de volumen para {MONTHS[month - 1]} {year}.
          </p>
        </div>
      )}

      {/* ── Data: grouped accordions ── */}
      {!isLoading && !error && grouped.length > 0 && (
        <div className="space-y-3">
          {grouped.map(([level, socios]) => (
            <MapReduceAccordion
              key={level}
              level={level}
              socios={socios}
              expanded={expandedLevel === level}
              onToggle={() => handleToggle(level)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
