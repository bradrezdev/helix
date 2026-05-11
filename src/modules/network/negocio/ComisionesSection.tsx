import { useState } from 'react'
import { useCommissions, type Commission } from '../../finances/comisiones/hooks/useCommissions.ts'

interface ComisionesSectionProps {
  userId: string
}

const BONO_COLORS: Record<string, string> = {
  patrocinio: '#0284C7',
  unilevel: '#7C3AED',
  infinito_patrocinio: '#4F46E5',
  avance_rango: '#D97706',
  match: '#059669',
}

function getBonoColor(bonoType: string): string {
  return BONO_COLORS[bonoType] ?? '#6B7280'
}

function getBonoLabel(bonoType: string): string {
  const labels: Record<string, string> = {
    patrocinio: 'Patrocinio',
    unilevel: 'Uninivel',
    infinito_patrocinio: 'Infinito Pat.',
    avance_rango: 'Avance Rango',
    match: 'Match',
  }
  return labels[bonoType] ?? bonoType
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatAmount(amount: number): string {
  return `$${amount.toFixed(2)}`
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function getSummaryCards(commissions: Commission[]) {
  const total = commissions.reduce((sum, c) => sum + c.amount, 0)
  const byType: Record<string, number> = {}
  for (const c of commissions) {
    byType[c.bono_type] = (byType[c.bono_type] ?? 0) + c.amount
  }
  return { total, byType }
}

function truncateId(id: string): string {
  return id.slice(0, 8) + '...'
}

export function ComisionesSection({ userId }: ComisionesSectionProps) {
  const now = new Date()
  // Default to previous month
  const defaultMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const defaultYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth)
  const [selectedYear, setSelectedYear] = useState(defaultYear)

  const { data: commissions, isLoading, isError } = useCommissions(userId, selectedMonth, selectedYear)

  const currentYear = now.getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  const summary = commissions ? getSummaryCards(commissions) : null

  const selectClass =
    'border border-[#EAECF0] rounded-xl text-sm px-3 py-1.5 bg-white text-[#383A3F] focus:outline-none focus:ring-2 focus:ring-[#0CBCE5]/30 cursor-pointer'

  return (
    <div className="bg-white rounded-[32px] border border-[#EAECF0] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2
            className="text-base font-semibold text-[#062A63]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Comisiones
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Resumen del período seleccionado</p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className={selectClass}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {MONTHS.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={selectClass}
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-[#0CBCE5] animate-spin" />
        </div>
      )}

      {isError && (
        <div className="text-center py-8 text-sm text-gray-400">
          No se pudieron cargar las comisiones.
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Summary cards */}
          {summary && commissions && commissions.length > 0 && (
            <div className="px-4 pb-4">
              <div className="overflow-x-auto">
                <div className="flex gap-3 pb-1" style={{ minWidth: 'max-content' }}>
                  {/* Total card */}
                  <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-sm px-4 py-3 min-w-[140px]">
                    <p className="text-xs text-gray-400 mb-1">Total del período</p>
                    <p
                      className="text-lg font-bold"
                      style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {formatAmount(summary.total)}
                    </p>
                  </div>

                  {/* Per-type cards */}
                  {Object.entries(summary.byType).map(([type, amount]) => (
                    <div
                      key={type}
                      className="bg-white rounded-2xl border border-[#EAECF0] shadow-sm px-4 py-3 min-w-[140px]"
                    >
                      <p className="text-xs text-gray-400 mb-1">{getBonoLabel(type)}</p>
                      <p
                        className="text-base font-semibold"
                        style={{ color: getBonoColor(type), fontFamily: 'Poppins, sans-serif' }}
                      >
                        {formatAmount(amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {(!commissions || commissions.length === 0) ? (
            <div className="text-center py-10 text-sm text-gray-400 px-5">
              Sin comisiones para este período
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-[#EAECF0]">
              <table
                className="min-w-[560px] w-full text-[13px]"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-5 py-3">
                      Tipo de bono
                    </th>
                    <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-3 py-3">
                      Monto
                    </th>
                    <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-3 py-3">
                      Nivel
                    </th>
                    <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-3 py-3">
                      Fuente
                    </th>
                    <th className="text-left text-xs text-gray-400 font-semibold uppercase tracking-wide px-5 py-3">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr
                      key={c.id}
                      className="border-t border-[#EAECF0] hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{
                            backgroundColor: `${getBonoColor(c.bono_type)}18`,
                            color: getBonoColor(c.bono_type),
                          }}
                        >
                          {getBonoLabel(c.bono_type)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 font-semibold" style={{ color: '#059669' }}>
                        {formatAmount(c.amount)}
                      </td>
                      <td className="px-3 py-3.5 text-gray-500">
                        {c.level != null ? c.level : '—'}
                      </td>
                      <td className="px-3 py-3.5 text-gray-400 font-mono text-xs">
                        {c.source_user_id ? truncateId(c.source_user_id) : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {formatDate(c.calculated_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
