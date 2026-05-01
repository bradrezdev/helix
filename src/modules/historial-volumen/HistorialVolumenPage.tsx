// ─── HistorialVolumenPage ──────────────────────────────────────────────────────
// Page displaying period volume history. Shows period list with
// year/month filtering via PeriodoSelector. Handles loading, error,
// empty, and filtered-data states.

import { useState, useMemo } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { usePeriodos } from '../../hooks/usePeriodos'
import { VolumenCard } from './components/VolumenCard'
import PeriodoSelector from './components/PeriodoSelector'
import MapReduceView from './components/MapReduceView'
import { cn } from '../../lib/utils'

export default function HistorialVolumenPage() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? '')
  const { data = [], isLoading, error, refetch } = usePeriodos(profile?.id)

  const [activeTab, setActiveTab] = useState<'periodo' | 'mapreduce'>('periodo')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)

  // ── Derived: unique years sorted descending ──
  const availableYears = useMemo(() => {
    const years = [...new Set(data.map((p) => p.period_year))]
    return years.sort((a, b) => b - a)
  }, [data])

  // ── Derived: filtered period list ──
  const filteredData = useMemo(() => {
    return data.filter((p) => {
      if (selectedYear !== null && p.period_year !== selectedYear) return false
      if (selectedMonth !== null && p.period_month !== selectedMonth) return false
      return true
    })
  }, [data, selectedYear, selectedMonth])

  // ── Handlers ──
  const handleYearChange = (year: number | null) => {
    setSelectedYear(year)
    setSelectedMonth(null) // reset month when year changes
  }

  // ── Render ──
  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6">
      {/* Page title */}
      <h1
        className="text-xl font-bold text-[#062A63]"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        Historial de Volumen
      </h1>

      {/* ── Tab bar ── */}
      <div className="mt-4 flex gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <button
          type="button"
          onClick={() => setActiveTab('periodo')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150',
            activeTab === 'periodo'
              ? 'bg-[#062A63] text-white'
              : 'bg-white border border-[#EAECF0] text-[#383A3F] hover:bg-[#F2F4F9]',
          )}
        >
          Por Periodo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mapreduce')}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150',
            activeTab === 'mapreduce'
              ? 'bg-[#062A63] text-white'
              : 'bg-white border border-[#EAECF0] text-[#383A3F] hover:bg-[#F2F4F9]',
          )}
        >
          MapReduce Volumen
        </button>
      </div>

      {/* ── Tab: Por Periodo ── */}
      {activeTab === 'periodo' && (
        <>
          {/* Period selector */}
          <div className="mt-4">
            <PeriodoSelector
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              availableYears={availableYears}
              onYearChange={handleYearChange}
              onMonthChange={setSelectedMonth}
            />
          </div>

      {/* ── Loading state ── */}
      {isLoading && (
        <div className="space-y-3 mt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-[24px] bg-[#F2F4F9] h-32 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Error state ── */}
      {error && (
        <div className="mt-4 rounded-[24px] bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">Error al cargar datos</p>
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
        <div className="mt-4 rounded-[24px] bg-[#F2F4F9] border border-[#EAECF0] p-8 text-center">
          <p
            className="text-sm text-[#9CA3AF]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Aún no hay historial de periodos. Los datos aparecerán después del primer cierre de mes.
          </p>
        </div>
      )}

      {/* ── Data ── */}
      {!isLoading && !error && filteredData.length > 0 && (
        <div className="space-y-3 mt-4">
          {filteredData.map((p) => (
            <VolumenCard
              key={p.period_id}
              periodo={p}
              isActive={p.status === 'active'}
            />
          ))}
        </div>
      )}
        </>
      )}

      {/* ── Tab: MapReduce Volumen ── */}
      {activeTab === 'mapreduce' && <MapReduceView />}
    </div>
  )
}
