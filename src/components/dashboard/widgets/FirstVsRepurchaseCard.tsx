// ─── FirstVsRepurchaseCard ────────────────────────────────────────────────────
// SVG line chart: Primeras compras vs Recompras — mensual (por día) o anual (por mes).

import { useState, useRef } from 'react'
import { WidgetSkeleton } from './WidgetSkeleton'
import { MonthDropdown } from './MonthDropdown'
import { getDaysInMonth, MONTH_LABELS_ES } from '../../../utils/calendar'
import { useFirstVsRepurchase } from '../../../hooks/useDashboardTops'

interface FirstVsRepurchaseCardProps {
  userId: string
  isAdmin: boolean
}

type ViewMode = 'mensual' | 'anual'

const CHART_H = 100
const CHART_PAD_T = 8
const CHART_PAD_B = 20

interface TooltipState {
  x: number
  y: number
  label: string
  first: number
  repurchase: number
}

function LineChart({
  data,
  firstColor,
  repurchaseColor,
  mode,
}: {
  data: { label: string; first: number; repurchase: number }[]
  firstColor: string
  repurchaseColor: string
  mode: ViewMode
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const n = data.length
  if (n === 0) return <div className="h-24 flex items-center justify-center text-xs text-gray-400">Sin datos</div>

  const maxVal = Math.max(...data.map((d) => Math.max(d.first, d.repurchase)), 1)
  const w = 100 // viewBox percent width
  const h = CHART_H
  const top = CHART_PAD_T
  const bottom = h - CHART_PAD_B

  function xPos(i: number): number {
    return n === 1 ? 50 : (i / (n - 1)) * w
  }

  function yPos(val: number): number {
    return top + ((1 - val / maxVal) * (bottom - top))
  }

  function buildPath(getter: (d: { first: number; repurchase: number }) => number): string {
    return data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(getter(d))}`)
      .join(' ')
  }

  function buildFill(getter: (d: { first: number; repurchase: number }) => number): string {
    const linePath = data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(getter(d))}`)
      .join(' ')
    return `${linePath} L ${xPos(n - 1)} ${bottom} L ${xPos(0)} ${bottom} Z`
  }

  const showEvery = mode === 'mensual' ? 5 : 1

  function handleSvgMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX = ((e.clientX - rect.left) / rect.width) * 100
    const relY = e.clientY - rect.top
    const idx = Math.round((relX / 100) * (n - 1))
    const clampedIdx = Math.max(0, Math.min(n - 1, idx))
    const d = data[clampedIdx]
    setTooltip({ x: e.clientX - rect.left, y: relY, label: d.label, first: d.first, repurchase: d.repurchase })
  }

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: `${h}px` }}
        onMouseMove={handleSvgMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Fill under first */}
        <path
          d={buildFill((d) => d.first)}
          fill={firstColor}
          fillOpacity={0.08}
        />
        {/* Fill under repurchase */}
        <path
          d={buildFill((d) => d.repurchase)}
          fill={repurchaseColor}
          fillOpacity={0.08}
        />
        {/* Line: first */}
        <path
          d={buildPath((d) => d.first)}
          fill="none"
          stroke={firstColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Line: repurchase */}
        <path
          d={buildPath((d) => d.repurchase)}
          fill="none"
          stroke={repurchaseColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xPos(i)} cy={yPos(d.first)} r="2" fill={firstColor} />
            <circle cx={xPos(i)} cy={yPos(d.repurchase)} r="2" fill={repurchaseColor} />
          </g>
        ))}
        {/* X labels */}
        {data.map((d, i) => {
          const showLabel = mode === 'mensual'
            ? Number(d.label) % showEvery === 0
            : true
          if (!showLabel) return null
          return (
            <text
              key={i}
              x={xPos(i)}
              y={h - 4}
              textAnchor="middle"
              fontSize="5"
              fill="#9ca3af"
            >
              {d.label}
            </text>
          )
        })}
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl bg-[#062A63] px-2.5 py-1.5 text-white shadow-lg"
          style={{ left: Math.min(tooltip.x, 180), top: Math.max(0, tooltip.y - 52) }}
        >
          <p className="text-[10px] font-semibold mb-0.5">{tooltip.label}</p>
          <p className="text-[10px]">
            <span className="opacity-70">Primeras: </span>{tooltip.first}
          </p>
          <p className="text-[10px]">
            <span className="opacity-70">Recompras: </span>{tooltip.repurchase}
          </p>
        </div>
      )}
    </div>
  )
}

export function FirstVsRepurchaseCard({ userId, isAdmin }: FirstVsRepurchaseCardProps) {
  const now = new Date()
  const [mode, setMode] = useState<ViewMode>('mensual')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data, isLoading } = useFirstVsRepurchase(userId, month, year, isAdmin)

  if (isLoading) return <WidgetSkeleton lines={6} />

  const firstColor = '#062A63'
  const repurchaseColor = '#0CBCE5'

  let chartData: { label: string; first: number; repurchase: number }[] = []

  if (mode === 'mensual') {
    const totalDays = getDaysInMonth(month, year)
    const firstByDay = new Map((data?.firstPurchases ?? []).map((p) => [p.day, p.count]))
    const repByDay = new Map((data?.repurchases ?? []).map((p) => [p.day, p.count]))

    for (let d = 1; d <= totalDays; d++) {
      chartData.push({
        label: String(d),
        first: firstByDay.get(d) ?? 0,
        repurchase: repByDay.get(d) ?? 0,
      })
    }
  } else {
    const firstByMonth = new Map((data?.annualFirstPurchases ?? []).map((p) => [p.month, p.count]))
    const repByMonth = new Map((data?.annualRepurchases ?? []).map((p) => [p.month, p.count]))

    for (let m = 1; m <= 12; m++) {
      chartData.push({
        label: MONTH_LABELS_ES[m] ?? String(m),
        first: firstByMonth.get(m) ?? 0,
        repurchase: repByMonth.get(m) ?? 0,
      })
    }
  }

  return (
    <div className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif]">
          Primeras vs Recompras
        </p>
        <div className="flex items-center gap-2">
          {mode === 'mensual' && (
            <MonthDropdown
              selectedMonth={month}
              selectedYear={year}
              onChange={(m, y) => { setMonth(m); setYear(y) }}
            />
          )}
          {/* Mensual / Anual toggle */}
          <div className="flex rounded-full bg-gray-100 p-0.5 text-xs">
            <button
              onClick={() => setMode('mensual')}
              className={`px-3 py-1 rounded-full transition-colors ${mode === 'mensual' ? 'bg-[#062A63] text-white' : 'text-gray-500'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setMode('anual')}
              className={`px-3 py-1 rounded-full transition-colors ${mode === 'anual' ? 'bg-[#062A63] text-white' : 'text-gray-500'}`}
            >
              Anual
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: firstColor }} />
          <span className="text-xs text-gray-500">Primeras compras</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: repurchaseColor }} />
          <span className="text-xs text-gray-500">Recompras</span>
        </div>
      </div>

      {/* Chart */}
      <LineChart
        data={chartData}
        firstColor={firstColor}
        repurchaseColor={repurchaseColor}
        mode={mode}
      />
    </div>
  )
}
