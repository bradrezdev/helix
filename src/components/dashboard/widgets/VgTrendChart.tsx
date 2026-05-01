// ─── VgTrendChart ─────────────────────────────────────────────────────────────
// 6-month VG trend as CSS bars (no external chart lib).
// Each bar: height proportional to max value, #0CBCE5 cyan fill.
// X-axis: month labels (e.g. "Ene", "Feb")

import { WidgetSkeleton } from './WidgetSkeleton'
import type { VgTrendPoint } from '../../../hooks/useNegocio'

interface VgTrendChartProps {
  points: VgTrendPoint[]
  isLoading?: boolean
  className?: string
}

export function VgTrendChart({ points, isLoading, className = '' }: VgTrendChartProps) {
  if (isLoading) return <WidgetSkeleton className={className} lines={4} />

  if (points.length === 0) {
    return (
      <div className={`rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5 ${className}`}>
        <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif] mb-1">
          Tendencia VG
        </p>
        <p className="text-sm text-gray-400 text-center py-6">Sin datos de tendencia</p>
      </div>
    )
  }

  const max = Math.max(...points.map((p) => p.total), 1)

  return (
    <div className={`rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5 ${className}`}>
      <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif] mb-4">
        Tendencia VG (últimos {points.length} meses)
      </p>
      {/* Chart area */}
      <div className="flex items-end gap-2 h-24" aria-label="Gráfica de tendencia VG">
        {points.map((point) => {
          const heightPct = (point.total / max) * 100
          return (
            <div key={`${point.year}-${point.month}`} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg bg-[#0CBCE5] transition-all duration-500"
                style={{ height: `${heightPct}%`, minHeight: point.total > 0 ? '4px' : '0' }}
                title={`${point.label}: ${point.total.toLocaleString('es-MX')}`}
              />
            </div>
          )
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-2 mt-1">
        {points.map((point) => (
          <p
            key={`lbl-${point.year}-${point.month}`}
            className="flex-1 text-center text-[10px] text-gray-400"
          >
            {point.label.split(' ')[0]}
          </p>
        ))}
      </div>
    </div>
  )
}
