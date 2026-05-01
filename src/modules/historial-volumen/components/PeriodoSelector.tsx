// ─── PeriodoSelector ──────────────────────────────────────────────────────────────
// Horizontal scrolling pill selector for year/month period filtering.
// Shows year pills always; month pills appear only when a year is selected.
// Edge case: empty availableYears → returns null (component hidden).

import { cn } from '../../../lib/utils'

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const

interface PeriodoSelectorProps {
  selectedYear: number | null
  selectedMonth: number | null
  availableYears: number[]
  onYearChange: (year: number | null) => void
  onMonthChange: (month: number | null) => void
}

export default function PeriodoSelector({
  selectedYear,
  selectedMonth,
  availableYears,
  onYearChange,
  onMonthChange,
}: PeriodoSelectorProps) {
  if (availableYears.length === 0) return null

  const pillBase =
    'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 shrink-0'

  const pillActive = 'bg-[#062A63] text-white'
  const pillInactive =
    'bg-white border border-[#EAECF0] text-[#383A3F] hover:bg-[#F2F4F9]'

  const scrollContainer =
    'flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden'
  const scrollInline: React.CSSProperties = {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  }

  return (
    <div className="flex flex-col gap-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* ── Year pills ── */}
      <div className={scrollContainer} style={scrollInline}>
        <button
          type="button"
          onClick={() => onYearChange(null)}
          className={cn(pillBase, selectedYear === null ? pillActive : pillInactive)}
        >
          Todos
        </button>

        {availableYears.map((year) => (
          <button
            key={year}
            type="button"
            onClick={() => onYearChange(year)}
            className={cn(pillBase, selectedYear === year ? pillActive : pillInactive)}
          >
            {year}
          </button>
        ))}
      </div>

      {/* ── Month pills (only visible when a year is selected) ── */}
      {selectedYear !== null && (
        <div className={scrollContainer} style={scrollInline}>
          <button
            type="button"
            onClick={() => onMonthChange(null)}
            className={cn(pillBase, selectedMonth === null ? pillActive : pillInactive)}
          >
            Todos los meses
          </button>

          {MONTHS.map((month, index) => {
            const monthNum = index + 1
            return (
              <button
                key={month}
                type="button"
                onClick={() => onMonthChange(monthNum)}
                className={cn(
                  pillBase,
                  selectedMonth === monthNum ? pillActive : pillInactive,
                )}
              >
                {month}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
