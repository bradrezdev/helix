// ─── ProgressRankCard ─────────────────────────────────────────────────────────
// Shows rank progression with real requirements: PV personal + VG grupal + leg volumes.
// Requirements sourced from plan-de-compensacion/avance-de-rango.md

import { WidgetSkeleton } from './WidgetSkeleton'
import { RANK_REQUIREMENTS } from '../../../lib/ranks'

interface ProgressRankCardProps {
  currentRank: string
  nextRank: string | null
  personalPv: number
  groupVg: number
  /** Leg volumes — sorted by volume desc */
  legs: Array<{ name: string; volume: number }>
  isLoading?: boolean
  /** @deprecated kept for backwards compat */
  progressPercent?: number
  /** @deprecated kept for backwards compat */
  daysLeftInMonth?: number
  className?: string
}

// ─── MetricRow ─────────────────────────────────────────────────────────────────

interface MetricRowProps {
  label: string
  leader?: string
  current: number
  required: number
  unit: string
}

function MetricRow({ label, leader, current, required, unit }: MetricRowProps) {
  const met = current >= required
  const pct = Math.min(100, Math.max(0, required > 0 ? (current / required) * 100 : 100))

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-600">{label}</span>
          {leader && (
            <span className="text-xs text-gray-400">({leader})</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs font-semibold text-[#062A63]">
            {current.toLocaleString('es-MX')} / {required.toLocaleString('es-MX')} {unit}
          </span>
          {met && <span className="text-xs text-green-500 font-bold">✓</span>}
        </div>
      </div>
      <div className="w-full rounded-full bg-gray-100 h-2 overflow-hidden">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: met ? '#22c55e' : '#062A63',
          }}
        />
      </div>
    </div>
  )
}

// ─── ProgressRankCard ─────────────────────────────────────────────────────────

export function ProgressRankCard({
  currentRank,
  nextRank,
  personalPv,
  groupVg,
  legs,
  isLoading,
  daysLeftInMonth,
  className = '',
}: ProgressRankCardProps) {
  if (isLoading) return <WidgetSkeleton className={className} lines={4} />

  if (!nextRank) {
    return (
      <div className={`rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5 ${className}`}>
        <p className="text-sm font-medium text-gray-500 mb-1">Progreso de Rango</p>
        <span className="inline-block rounded-full bg-[#062A63]/10 px-3 py-1 text-xs font-semibold text-[#062A63] mb-2">
          {currentRank}
        </span>
        <p className="mt-1 text-sm font-semibold text-[#0CBCE5]">
          🏆 Rango máximo alcanzado
        </p>
      </div>
    )
  }

  const nextReqs = RANK_REQUIREMENTS[nextRank]
  const pvRequired = nextReqs?.pv ?? 100
  const groupVgRequired = nextReqs?.groupVg
  const longestLegRequired = nextReqs?.longestLeg
  const shortestLegRequired = nextReqs?.shortestLeg

  // Pierna mayor: legs[0]
  const longestLeg = legs[0]
  // Piernas restantes: sumar legs[1..n]
  const restLegs = legs.slice(1)
  const restVolume = restLegs.reduce((sum, l) => sum + l.volume, 0)
  // Nombre representativo del resto: el más grande del resto
  const restLeader = restLegs[0]?.name

  // Calcular métricas para el progreso general
  type Metric = { current: number; required: number }
  const metrics: Metric[] = []

  // PV
  metrics.push({ current: personalPv, required: pvRequired })

  // VG grupal
  if (groupVgRequired !== undefined) {
    metrics.push({ current: groupVg, required: groupVgRequired })
  }

  // Piernas (solo si el rango las requiere)
  if (longestLegRequired !== undefined) {
    metrics.push({ current: longestLeg?.volume ?? 0, required: longestLegRequired })
  }
  if (shortestLegRequired !== undefined) {
    metrics.push({ current: restVolume, required: shortestLegRequired })
  }

  const metCount = metrics.filter((m) => m.current >= m.required).length
  const totalMetrics = metrics.length
  const overallPct = totalMetrics > 0
    ? Math.round((metCount / totalMetrics) * 100)
    : 0

  return (
    <div className={`rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-500">Progreso de Rango</p>
          <span className="inline-block rounded-full bg-[#062A63]/10 px-2.5 py-0.5 text-xs font-semibold text-[#062A63]">
            {currentRank}
          </span>
        </div>
        {daysLeftInMonth !== undefined && (
          <p className="text-xs text-gray-400">{daysLeftInMonth}d restantes</p>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-3">
        Para llegar a <span className="font-semibold text-[#0CBCE5]">{nextRank}</span>:
      </p>

      <div className="space-y-3">
        {/* 1. PV Personal */}
        <MetricRow
          label="PV Personal"
          current={personalPv}
          required={pvRequired}
          unit="PV"
        />

        {/* 2. VG Grupal */}
        {groupVgRequired !== undefined && (
          <MetricRow
            label="Volumen Grupal"
            current={groupVg}
            required={groupVgRequired}
            unit="VG"
          />
        )}

        {/* 3. Pierna mayor */}
        {longestLegRequired !== undefined && (
          <MetricRow
            label="Pierna mayor"
            leader={longestLeg?.name}
            current={longestLeg?.volume ?? 0}
            required={longestLegRequired}
            unit="VG"
          />
        )}

        {/* 4. Resto de piernas */}
        {shortestLegRequired !== undefined && (
          <MetricRow
            label="Resto de piernas"
            leader={restLeader}
            current={restVolume}
            required={shortestLegRequired}
            unit="VG"
          />
        )}

        {/* 5. Progreso general */}
        <div className="pt-1 border-t border-gray-100 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Progreso general</span>
            <span className="text-xs font-semibold text-[#062A63]">
              {overallPct}% · {metCount} de {totalMetrics} requisitos
            </span>
          </div>
          <div className="w-full rounded-full bg-gray-100 h-2.5 overflow-hidden flex">
            {metrics.map((m, i) => {
              const segPct = Math.min(100, Math.max(0, m.required > 0 ? (m.current / m.required) * 100 : 100))
              const met = m.current >= m.required
              return (
                <div
                  key={i}
                  className="h-2.5 transition-all duration-500"
                  style={{
                    width: `${100 / totalMetrics}%`,
                    backgroundColor: 'transparent',
                    position: 'relative' as const,
                  }}
                >
                  <div
                    className="h-2.5 absolute left-0 top-0 transition-all duration-500"
                    style={{
                      width: `${segPct}%`,
                      backgroundColor: met ? '#22c55e' : '#062A63',
                      borderRadius: i === 0 ? '9999px 0 0 9999px' : i === totalMetrics - 1 ? '0 9999px 9999px 0' : '0',
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
