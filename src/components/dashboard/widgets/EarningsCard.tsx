// ─── EarningsCard ─────────────────────────────────────────────────────────────
// SVG line chart: Ganancias (comisiones) por día (mensual) o por mes (anual).

import { useState, useRef } from 'react'
import { WidgetSkeleton } from './WidgetSkeleton'
import { MonthDropdown } from './MonthDropdown'
import { getDaysInMonth, MONTH_LABELS_ES } from '../../../lib/calendar.ts'
import { useEarnings } from '../../../modules/network/dashboard/hooks/useDashboardTops.ts'
import { formatAmount } from '../../../lib/formatters'

interface EarningsCardProps {
  userId: string
  isAdmin: boolean
}

type ViewMode = 'mensual' | 'anual'

const CHART_H = 100
const CHART_PAD_T = 8
const CHART_PAD_B = 20
const LINE_COLOR = '#0CBCE5'

interface TooltipState {
  x: number
  y: number
  label: string
  amount: number
}

function EarningsLineChart({
  data,
  mode,
}: {
  data: { label: string; amount: number }[]
  mode: ViewMode
}) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const n = data.length
  if (n === 0) return <div className="h-24 flex items-center justify-center text-xs text-gray-400">Sin datos</div>

  const maxVal = Math.max(...data.map((d) => d.amount), 1)
  const w = 100
  const h = CHART_H
  const top = CHART_PAD_T
  const bottom = h - CHART_PAD_B

  function xPos(i: number): number {
    return n === 1 ? 50 : (i / (n - 1)) * w
  }

  function yPos(val: number): number {
    return top + ((1 - val / maxVal) * (bottom - top))
  }

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i)} ${yPos(d.amount)}`)
    .join(' ')

  const fillPath = `${linePath} L ${xPos(n - 1)} ${bottom} L ${xPos(0)} ${bottom} Z`

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX = ((e.clientX - rect.left) / rect.width) * 100
    const relY = e.clientY - rect.top
    const idx = Math.max(0, Math.min(n - 1, Math.round((relX / 100) * (n - 1))))
    const d = data[idx]
    setTooltip({ x: e.clientX - rect.left, y: relY, label: d.label, amount: d.amount })
  }

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: `${h}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Fill under line */}
        <path d={fillPath} fill={LINE_COLOR} fillOpacity={0.1} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={LINE_COLOR}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {data.map((d, i) => (
          <circle key={i} cx={xPos(i)} cy={yPos(d.amount)} r="2" fill={LINE_COLOR} />
        ))}

        {/* X labels */}
        {data.map((d, i) => {
          const show = mode === 'mensual' ? Number(d.label) % 5 === 0 : true
          if (!show) return null
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
          style={{ left: Math.min(tooltip.x, 180), top: Math.max(0, tooltip.y - 44) }}
        >
          <p className="text-[10px] font-semibold mb-0.5">{tooltip.label}</p>
          <p className="text-[10px]">{formatAmount(tooltip.amount, 'MXN')}</p>
        </div>
      )}
    </div>
  )
}

export function EarningsCard({ userId, isAdmin }: EarningsCardProps) {
  const now = new Date()
  const [mode, setMode] = useState<ViewMode>('mensual')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data, isLoading } = useEarnings(userId, month, year, isAdmin)

  if (isLoading) return <WidgetSkeleton lines={6} />

  let chartData: { label: string; amount: number }[] = []

  if (mode === 'mensual') {
    const totalDays = getDaysInMonth(month, year)
    const dailyMap = new Map((data?.daily ?? []).map((p) => [p.day, p.amount]))
    for (let d = 1; d <= totalDays; d++) {
      chartData.push({ label: String(d), amount: dailyMap.get(d) ?? 0 })
    }
  } else {
    const monthlyMap = new Map((data?.monthly ?? []).map((p) => [p.month, p.amount]))
    for (let m = 1; m <= 12; m++) {
      chartData.push({
        label: MONTH_LABELS_ES[m] ?? String(m),
        amount: monthlyMap.get(m) ?? 0,
      })
    }
  }

  const totalDisplay = data?.totalForPeriod ?? 0

  return (
    <div className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif]">
          Ganancias
        </p>
        <div className="flex items-center gap-2">
          {mode === 'mensual' && (
            <MonthDropdown
              selectedMonth={month}
              selectedYear={year}
              onChange={(m, y) => { setMonth(m); setYear(y) }}
            />
          )}
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

      {/* Total prominently */}
      <p className="text-2xl font-bold text-[#062A63] font-[Poppins,sans-serif] mb-3">
        {formatAmount(totalDisplay, 'MXN')}
      </p>

      {/* Chart */}
      <EarningsLineChart data={chartData} mode={mode} />
    </div>
  )
}
