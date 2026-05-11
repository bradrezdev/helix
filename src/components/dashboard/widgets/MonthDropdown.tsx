// ─── MonthDropdown ────────────────────────────────────────────────────────────
// Compact dropdown period picker — replaces the pill-based PeriodPicker.
// Shows last N months as a select dropdown: "Mayo 2026", "Abril 2026", etc.

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { getLastNMonths, MONTH_FULL_ES } from '../../../lib/calendar.ts'

interface MonthDropdownProps {
  selectedMonth: number
  selectedYear: number
  onChange: (month: number, year: number) => void
  months?: number
}

export function MonthDropdown({
  selectedMonth,
  selectedYear,
  onChange,
  months = 6,
}: MonthDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const options = getLastNMonths(months)

  const selectedLabel = `${MONTH_FULL_ES[selectedMonth] ?? selectedMonth} ${selectedYear}`

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <span>{selectedLabel}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-44 rounded-2xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.12)] border border-gray-100 py-1 overflow-hidden">
          {[...options].reverse().map((opt) => {
            const isSelected = opt.month === selectedMonth && opt.year === selectedYear
            return (
              <button
                key={`${opt.year}-${opt.month}`}
                onClick={() => {
                  onChange(opt.month, opt.year)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                  isSelected
                    ? 'bg-[#062A63] text-white font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {MONTH_FULL_ES[opt.month] ?? opt.month} {opt.year}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
