// ─── NivelAccordion ────────────────────────────────────────────────────────────
// Expandable card for a single commission level.
// Header shows level summary (socio count, PV, CV total); body lists SocioRow
// components when expanded. Active left border (#0CBCE5) when open.

import { ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/utils'

import SocioRow from './SocioRow'
import type { ComisionNivel } from '../../../hooks/useComisionesNivel'
import type { SocioNivel } from '../../../hooks/useSociosNivel'

interface NivelAccordionProps {
  nivel: ComisionNivel
  expanded: boolean
  onToggle: () => void
  socios: SocioNivel[]
  isLoadingSocios: boolean
}

export default function NivelAccordion({
  nivel,
  expanded,
  onToggle,
  socios,
  isLoadingSocios,
}: NivelAccordionProps) {
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
          {/* Level number */}
          <span className="font-bold text-[#062A63]">
            Nivel {nivel.level}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0]">
            —
          </span>

          {/* Socios count */}
          <span className="text-[#383A3F]" data-testid={`nivel-count-${nivel.level}`}>
            {nivel.total_socios} {nivel.total_socios === 1 ? 'socio' : 'socios'}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0]">
            —
          </span>

          {/* PV total */}
          <span className="text-[#383A3F]">
            PV: {nivel.total_pv.toLocaleString('es-MX')}
          </span>

          <span aria-hidden="true" className="text-[#EAECF0]">
            —
          </span>

          {/* CV total — volumen */}
          <span className="text-[#383A3F]">
            CV: {nivel.total_cv.toLocaleString('es-MX')}
          </span>
        </div>

        {/* Chevron — rotates 180° when expanded */}
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
          {isLoadingSocios ? (
            /* Skeleton loading rows */
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse bg-[#F2F4F9] rounded-[12px]"
                />
              ))}
            </div>
          ) : socios.length === 0 ? (
            /* Empty body state */
            <div className="p-6 text-center text-sm text-[#9CA3AF]">
              Sin socios en este nivel para el periodo seleccionado.
            </div>
          ) : (
            /* Socio table */
            <div role="table" aria-label={`Socios del nivel ${nivel.level}`}>
              <SocioRow socio={{} as SocioNivel} isHeader />
              {socios.map((socio) => (
                <SocioRow key={socio.user_id} socio={socio} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
