// ─── PeriodPicker ─────────────────────────────────────────────────────────────
// Shared period picker: shows last N months as selectable pills.

import { getLastNMonths } from '../../../lib/calendar.ts'

interface PeriodPickerProps {
  selectedMonth: number
  selectedYear: number
  onChange: (month: number, year: number) => void
  months?: number
}

export function PeriodPicker({ selectedMonth, selectedYear, onChange, months = 6 }: PeriodPickerProps) {
  const options = getLastNMonths(months)

  return (
    <div className="flex gap-1.5 flex-wrap mb-4">
      {options.map((opt) => {
        const isSelected = opt.month === selectedMonth && opt.year === selectedYear
        return (
          <button
            key={`${opt.year}-${opt.month}`}
            onClick={() => onChange(opt.month, opt.year)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              isSelected
                ? 'bg-[#062A63] text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {opt.label} {opt.year !== new Date().getFullYear() ? opt.year : ''}
          </button>
        )
      })}
    </div>
  )
}
