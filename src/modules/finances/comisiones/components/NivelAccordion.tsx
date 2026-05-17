// ─── NivelAccordion ────────────────────────────────────────────────────────────
// Expandable card for a single commission level.
// Header shows level summary (socio count, PV, CV total, amount).
// Body lists individual commissions with Fecha | Bono | Origen | PV | CV | % | Ganancia.
// Sortable columns: Fecha (asc default), PV, CV, Ganancia.
// Paginated: 20 items per page, "Cargar más" button.
// Active left border (#0CBCE5) when open.
//
// Intent: Distribuidor ONANO revisando comisiones por nivel.
// Feel: Preciso como reporte financiero — cada comisión rastreable.

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../../../lib/utils.ts'
import { formatBonoType, formatCurrency } from '../../../../lib/formatters.ts'
import type { ComisionNivel } from '../hooks/useComisionesNivel.ts'
import type { ComisionNivelSocio } from '../hooks/useComisionesNivelSocios.ts'

type SortKey = 'fecha' | 'pv' | 'cv' | 'ganancia'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 20

interface NivelAccordionProps {
  nivel: ComisionNivel
  expanded: boolean
  onToggle: () => void
  comisiones: ComisionNivelSocio[]
  isLoadingComisiones: boolean
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd}-${mm}-${yy}`
}

// ─── Loading skeleton ───────────────────────────────────────────────────────────

function BodySkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-10 animate-pulse bg-[#F2F4F9] rounded-[12px]"
        />
      ))}
    </div>
  )
}

// ─── Sort header button ─────────────────────────────────────────────────────────

function SortHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onClick,
}: {
  label: string
  sortKey: SortKey
  activeKey: SortKey
  direction: SortDir
  onClick: (key: SortKey) => void
}) {
  const isActive = activeKey === sortKey
  return (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium uppercase transition-colors cursor-pointer',
        isActive ? 'text-[#062A63]' : 'text-[#9CA3AF]',
      )}
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {label}
      {isActive && (
        <span className="text-[10px] leading-none">{direction === 'asc' ? '▲' : '▼'}</span>
      )}
    </button>
  )
}

// ─── Table header row ───────────────────────────────────────────────────────────

function TableHeader({
  sortKey,
  sortDir,
  onSort,
}: {
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}) {
  return (
    <div
      className="grid grid-cols-[80px_100px_1fr_80px_80px_70px_130px] items-center gap-2 bg-[#F2F4F9] text-[#9CA3AF] text-xs font-medium uppercase py-2.5 px-4"
      style={{ fontFamily: 'Poppins, sans-serif' }}
      role="row"
    >
      <SortHeader label="Fecha" sortKey="fecha" activeKey={sortKey} direction={sortDir} onClick={onSort} />
      <div role="columnheader" className="text-left">Bono</div>
      <div role="columnheader" className="text-left">Origen</div>
      <SortHeader label="PV" sortKey="pv" activeKey={sortKey} direction={sortDir} onClick={onSort} />
      <SortHeader label="CV" sortKey="cv" activeKey={sortKey} direction={sortDir} onClick={onSort} />
      <div role="columnheader" className="text-right">%</div>
      <SortHeader label="Ganancia" sortKey="ganancia" activeKey={sortKey} direction={sortDir} onClick={onSort} />
    </div>
  )
}

// ─── Currency badge ─────────────────────────────────────────────────────────────

function CurrencyBadge({ currency }: { currency: string }) {
  return (
    <span
      className="inline-flex items-center text-[10px] font-semibold uppercase rounded-full px-1.5 py-0.5 shrink-0"
      style={{
        backgroundColor: 'rgba(12,188,229,0.10)',
        color: '#0CBCE5',
      }}
    >
      {currency}
    </span>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function NivelAccordion({
  nivel,
  expanded,
  onToggle,
  comisiones,
  isLoadingComisiones,
}: NivelAccordionProps) {
  const [sortKey, setSortKey] = useState<SortKey>('fecha')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'fecha' ? 'asc' : 'desc')
    }
  }

  const sorted = [...comisiones].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    switch (sortKey) {
      case 'fecha':
        return dir * (new Date(a.calculated_at).getTime() - new Date(b.calculated_at).getTime())
      case 'pv':
        return dir * (a.pv - b.pv)
      case 'cv':
        return dir * (a.cv - b.cv)
      case 'ganancia':
        return dir * (a.ganancia - b.ganancia)
      default:
        return 0
    }
  })

  const displayed = sorted.slice(0, displayCount)
  const totalCount = sorted.length
  const hasMore = displayCount < totalCount

  function handleLoadMore() {
    setDisplayCount(c => c + PAGE_SIZE)
  }

  return (
    <div
      className={cn(
        'bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)] overflow-hidden',
        expanded && 'border-l-[3px] border-l-[#0CBCE5]',
      )}
      data-testid={`nivel-accordion-${nivel.level}`}
    >
      {/* ── Header (clickable) ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 cursor-pointer text-left"
        style={{ fontFamily: 'Poppins, sans-serif' }}
        aria-expanded={expanded}
        data-testid={`nivel-header-${nivel.level}`}
      >
        <div className="flex items-center gap-4 text-sm">
          <span className="font-bold text-[#062A63]">
            Nivel {nivel.level}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0]">—</span>

          <span className="text-[#383A3F]" data-testid={`nivel-count-${nivel.level}`}>
            {nivel.total_socios} {nivel.total_socios === 1 ? 'socio' : 'socios'}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0]">—</span>

          <span className="text-[#383A3F]">
            PV: {nivel.total_pv.toLocaleString('es-MX')}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0]">—</span>

          <span className="text-[#383A3F]">
            CV: {nivel.total_cv.toLocaleString('es-MX')}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0]">—</span>

          <span className="font-semibold text-[#062A63]">
            {formatCurrency(nivel.total_amount, 'MXN')}
          </span>
        </div>

        <ChevronDown
          size={20}
          color="#062A63"
          className={cn(
            'shrink-0 transition-transform duration-200',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {/* ── Body (conditional) ── */}
      {expanded && (
        <div className="border-t border-[#EAECF0] overflow-x-auto">
          {isLoadingComisiones ? (
            <BodySkeleton />
          ) : comisiones.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#9CA3AF]">
              Sin comisiones en este nivel para el periodo seleccionado.
            </div>
          ) : (
            <div role="table" aria-label={`Comisiones del nivel ${nivel.level}`}>
              <TableHeader sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
              {displayed.map((c, idx) => (
                <div
                  key={`${c.socio_user_id}-${c.bono_type}-${c.source_order_code}-${idx}`}
                  className="grid grid-cols-[80px_100px_1fr_80px_80px_70px_130px] items-center gap-2 py-2.5 px-4 border-b border-[#EAECF0] last:border-0 text-sm"
                  style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                  role="row"
                >
                  {/* Fecha */}
                  <span className="text-xs text-[#9CA3AF]" role="cell">
                    {formatDate(c.calculated_at)}
                  </span>

                  {/* Bono type */}
                  <span className="text-xs font-medium text-[#0CBCE5]" role="cell">
                    {formatBonoType(c.bono_type)}
                  </span>

                  {/* Origen */}
                  <span className="truncate text-sm" role="cell" title={c.socio_name}>
                    {c.socio_name}
                  </span>

                  {/* PV */}
                  <span className="text-sm" role="cell">
                    {c.pv.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>

                  {/* CV */}
                  <span className="text-sm" role="cell">
                    {c.cv.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>

                  {/* % */}
                  <span className="text-xs text-[#9CA3AF]" role="cell">
                    {c.percentage != null ? `${c.percentage.toFixed(1)}%` : '—'}
                  </span>

                  {/* Ganancia + currency badge */}
                  <span className="text-right font-semibold text-[#062A63] flex items-center justify-end gap-1" role="cell">
                    {formatCurrency(c.ganancia, c.currency)}
                    <CurrencyBadge currency={c.currency} />
                  </span>
                </div>
              ))}

              {/* ── Pagination footer ── */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#EAECF0]">
                <span
                  className="text-xs text-[#9CA3AF]"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Mostrando {Math.min(displayCount, totalCount)} de {totalCount} registros
                </span>
                {hasMore && (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    className="text-xs font-medium text-[#0CBCE5] hover:text-[#062A63] transition-colors cursor-pointer"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Cargar más
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
