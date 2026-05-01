// ─── GananciasPage ─────────────────────────────────────────────────────────────
// Dashboard page showing commissions aggregated by bonus type in a bento grid.
// Period filtering via year/month dropdown selects.
//
// States: loading (4 skeleton cards), error (red card + retry),
//          empty (centered message), empty filtered (message),
//          data (bento grid of BonoCards).
//
// Dependencies:
//   useCommissions(userId, month, year) — filters by period server-side
//   aggregateByGroup(commissions)      — groups client-side by bono_type

import { useState, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useCommissions } from '../../hooks/useCommissions'
import { aggregateByGroup, type BonoGroup } from './utils'
import { getBonoColor } from './constants'
import BonoCard from './components/BonoCard'

// ─── Static year/month options ──────────────────────────────────────────────────

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1 // 1–12

const YEAR_OPTIONS = [currentYear, currentYear - 1, currentYear - 2]

const MONTH_OPTIONS: { label: string; value: number }[] = [
  { label: 'Enero', value: 1 },
  { label: 'Febrero', value: 2 },
  { label: 'Marzo', value: 3 },
  { label: 'Abril', value: 4 },
  { label: 'Mayo', value: 5 },
  { label: 'Junio', value: 6 },
  { label: 'Julio', value: 7 },
  { label: 'Agosto', value: 8 },
  { label: 'Septiembre', value: 9 },
  { label: 'Octubre', value: 10 },
  { label: 'Noviembre', value: 11 },
  { label: 'Diciembre', value: 12 },
]

// ─── Shared select styles ──────────────────────────────────────────────────────

const selectBase =
  'rounded-[14px] border border-[#EAECF0] px-3 py-2 text-sm bg-white cursor-pointer appearance-none'
const selectInline: React.CSSProperties = {
  fontFamily: 'Poppins, sans-serif',
  color: '#383A3F',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: '32px',
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-[24px] bg-[#F2F4F9] h-32 animate-pulse"
        />
      ))}
    </div>
  )
}

// ─── Error card ────────────────────────────────────────────────────────────────

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-4 bg-[#FFF1F0] border border-[#FFA39E] rounded-[24px] p-5 text-center">
      <p
        className="text-sm text-[#CF1322] mb-3"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        No se pudieron cargar las comisiones. Intenta de nuevo.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white bg-[#CF1322] hover:bg-[#A8071A] transition-colors"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        <RefreshCw size={14} />
        Reintentar
      </button>
    </div>
  )
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-4 bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)] p-8 text-center" data-testid="ganancias-empty">
      <p
        className="text-sm text-[#9CA3AF]"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {message}
      </p>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function GananciasPage() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? '')

  // ── Period state ──
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth)
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)

  // ── Data query ──
  const {
    data: commissions,
    isLoading,
    error,
    refetch,
  } = useCommissions(profile?.id ?? '', selectedMonth, selectedYear)

  // ── Aggregate by bono_type ──
  const grupos: BonoGroup[] = useMemo(
    () => (commissions ? aggregateByGroup(commissions) : []),
    [commissions],
  )

  // ── Navigation ──
  const navigate = useNavigate()

  const handleCardClick = (key: string) => {
    navigate({ to: '/ganancias/$bonoType', params: { bonoType: key } })
  }

  // ── Handlers ──
  const handleYearChange = (value: string) => {
    setSelectedYear(Number(value))
  }

  const handleMonthChange = (value: string) => {
    setSelectedMonth(Number(value))
  }

  // ── Render ──
  const renderContent = () => {
    if (isLoading) return <LoadingSkeleton />
    if (error) return <ErrorCard onRetry={refetch} />
    if (grupos.length === 0) {
      return (
        <EmptyState message="Sin comisiones en este periodo. Las comisiones aparecerán después del cierre de mes." />
      )
    }

    return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4" data-testid="ganancias-loading">
        {grupos.map((g) => (
          <BonoCard
            key={g.key}
            group={g}
            color={getBonoColor(g.key)}
            onClick={() => handleCardClick(g.key)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6" data-testid="ganancias-container">
      {/* Page title */}
      <h1
        className="text-xl font-bold"
        style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
      >
        Ganancias por Bono
      </h1>

      {/* Period selector — inline year + month dropdowns */}
      <div className="flex gap-2 mt-4 mb-1">
        {/* Year dropdown */}
        <select
          value={selectedYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className={selectBase}
          style={selectInline}
          aria-label="Seleccionar año"
        >
          {YEAR_OPTIONS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        {/* Month dropdown */}
        <select
          value={selectedMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className={selectBase}
          style={selectInline}
          aria-label="Seleccionar mes"
        >
          {MONTH_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content: loading / error / empty / data */}
      {renderContent()}
    </div>
  )
}
