// ─── ComisionesNivelPage ───────────────────────────────────────────────────────
// Page displaying commissions grouped by genealogy level.
// Period filtering via month/year dropdowns; drill-down per level via accordion.
// Expanded level shows individual commissions: Bono | Origen | PV | CV | % | Ganancia
//
// Uses:
//   get_comisiones_nivel_all → level summaries (header)
//   get_comisiones_nivel_socios → individual commissions (expanded body)
//
// States: loading (skeleton cards), error (retry card), empty (info card),
//          filtered empty (info card), data (accordion list).

import { useState, useMemo, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth.ts'
import { useProfile } from '../../auth/hooks/useProfile.ts'
import { useComisionesNivel } from './hooks/useComisionesNivel.ts'
import { useComisionesNivelSocios } from './hooks/useComisionesNivelSocios.ts'
import NivelAccordion from './components/NivelAccordion.tsx'

// ─── Month options ──────────────────────────────────────────────────────────────

const MONTH_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Todos los meses', value: null },
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

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 3 }, (_, i) => currentYear - i)

// ─── Build periodo string for the RPC ──────────────────────────────────────────
// get_comisiones_nivel_socios expects 'YYYY-M' or 'todos'

function buildPeriodo(month: number | null, year: number | null): string {
  if (month == null && year == null) return 'todos'
  const y = year ?? currentYear
  const m = month ?? 1
  return `${y}-${m}`
}

// ─── Shared select styles ─────────────────────────────────────────────────────

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

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-16 animate-pulse bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)]"
        />
      ))}
    </div>
  )
}

// ─── Error card ───────────────────────────────────────────────────────────────

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-[#FFF1F0] border border-[#FFA39E] rounded-[24px] p-5 text-center">
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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)] p-8 text-center" data-testid="comisiones-empty">
      <p
        className="text-sm text-[#9CA3AF]"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        Sin comisiones en este periodo. Las comisiones aparecerán después del
        cierre de mes.
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ComisionesNivelPage() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? '')

  // ── Period state ──
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(currentYear)

  // ── Accordion expansion ──
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null)

  // ── Derived periodo string ──
  const periodo = useMemo(
    () => buildPeriodo(selectedMonth, selectedYear),
    [selectedMonth, selectedYear],
  )

  // ── Level summaries ──
  const {
    data: niveles = [],
    isLoading,
    error,
    refetch,
  } = useComisionesNivel({
    userId: profile?.id,
    month: selectedMonth,
    year: selectedYear,
  })

  // ── Individual commissions for expanded level ──
  const {
    data: comisiones = [],
    isLoading: comisionesLoading,
  } = useComisionesNivelSocios({
    userId: profile?.id,
    nivel: expandedLevel,
    periodo,
  })

  // ── Handlers ──
  const handleToggle = useCallback((level: number) => {
    setExpandedLevel((prev) => (prev === level ? null : level))
  }, [])

  const handleMonthChange = (value: string) => {
    setSelectedMonth(value === '' ? null : Number(value))
  }

  const handleYearChange = (value: string) => {
    setSelectedYear(value === '' ? null : Number(value))
  }

  // ── Render ──
  const renderData = () => {
    if (isLoading) return <LoadingSkeleton />
    if (error) return <ErrorCard onRetry={refetch} />
    if (niveles.length === 0) return <EmptyState />

    return (
      <div className="space-y-3">
        {niveles.map((nivel) => (
          <NivelAccordion
            key={nivel.level}
            nivel={nivel}
            expanded={expandedLevel === nivel.level}
            onToggle={() => handleToggle(nivel.level)}
            comisiones={expandedLevel === nivel.level ? comisiones : []}
            isLoadingComisiones={expandedLevel === nivel.level && comisionesLoading}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6" data-testid="comisiones-nivel-container">
      {/* ── Title ── */}
      <h1
        className="text-xl font-bold mb-4"
        style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
      >
        Comisiones por Nivel
      </h1>

      {/* ── Period selector ── */}
      <div className="flex gap-2 mb-5">
        <select
          value={selectedYear ?? ''}
          onChange={(e) => handleYearChange(e.target.value)}
          className={selectBase}
          style={selectInline}
          aria-label="Seleccionar año"
        >
          <option value="">Todos los años</option>
          {YEAR_OPTIONS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>

        <select
          value={selectedMonth ?? ''}
          onChange={(e) => handleMonthChange(e.target.value)}
          className={selectBase}
          style={selectInline}
          aria-label="Seleccionar mes"
        >
          {MONTH_OPTIONS.map((opt) => (
            <option key={opt.label} value={opt.value ?? ''}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Data / States ── */}
      {renderData()}
    </div>
  )
}
