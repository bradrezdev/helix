// ─── BonoDetail ───────────────────────────────────────────────────────────────
// Detail page for a specific bonus type reached via /ganancias/$bonoType.
// Shows a header summary card and a transaction table using get_comisiones_detalle.
//
// Columns: Origen (source_name) | # Orden (source_order_code) | PV | CV | % | Monto
//
// Intent: Distribuidor que hizo clic en una card de bono y quiere ver el detalle
//          de cada transacción — origen, orden, PV, CV, montos.
// Feel: Preciso tipo estado de cuenta bancario. Serio, confiable, ordenado.
//
// Palette: ONANO primary #062A63, accents from GANANCIAS_BONO_COLORS,
//          background #F2F4F9, border #EAECF0, muted #9CA3AF, text #383A3F.
// Depth: Borde sutil + shadow Apple-style en cards.
// Typography: Poppins para datos financieros.

import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth.ts'
import { useProfile } from '../../../auth/hooks/useProfile.ts'
import { useComisionesDetalle } from '../../comisiones/hooks/useComisionesDetalle.ts'
import { BONO_TYPE_LABELS, formatCurrency } from '../../../../lib/formatters.ts'
import { getBonoColor } from '../constants.ts'

// ─── Remove the local BONO_LABELS alias — we use BONO_TYPE_LABELS directly

// ─── Sub-components ─────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <div className="h-6 w-20 bg-[#F2F4F9] rounded mb-4 animate-pulse" />
      <div className="rounded-[24px] p-5 shadow-[0_4px_24px_rgba(6,42,99,0.07)] mb-4 animate-pulse">
        <div className="h-6 w-40 bg-[#F2F4F9] rounded mb-3" />
        <div className="h-8 w-48 bg-[#F2F4F9] rounded mb-2" />
        <div className="h-4 w-32 bg-[#F2F4F9] rounded" />
      </div>
      <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)] overflow-hidden">
        <div className="grid grid-cols-6 bg-[#F2F4F9] px-4 py-2.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-3 bg-[#E5E7EB] rounded animate-pulse" style={{ width: i <= 1 ? '100px' : i === 2 ? '80px' : '50px' }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="grid grid-cols-6 px-4 py-3 border-b border-[#EAECF0] last:border-0">
            {[1, 2, 3, 4, 5, 6].map((col) => (
              <div key={col} className="h-4 bg-[#F2F4F9] rounded animate-pulse" style={{ width: col <= 1 ? '100px' : col === 2 ? '80px' : '50px' }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function NotFoundCard() {
  const navigate = useNavigate()
  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
      <button
        type="button"
        onClick={() => navigate({ to: '/ganancias' })}
        className="flex items-center gap-1 mb-4 text-sm"
        style={{ color: '#383A3F' }}
      >
        <ArrowLeft size={16} />
        Volver
      </button>
      <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)] p-8 text-center">
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          Bono no encontrado
        </p>
      </div>
    </div>
  )
}

// ─── Currency badge component ──────────────────────────────────────────────────

function CurrencyBadge({ currency }: { currency: string }) {
  return (
    <span
      className="inline-flex items-center text-[10px] font-semibold uppercase rounded-full px-1.5 py-0.5 ml-1.5 shrink-0"
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

export default function BonoDetail() {
  const { bonoType } = useParams({ from: '/authenticated/ganancias/$bonoType' })
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? '')

  const label = BONO_TYPE_LABELS[bonoType]
  const color = getBonoColor(bonoType)

  // ── Fetch detalle comisiones via RPC ──
  const {
    data: commissions,
    isLoading,
  } = useComisionesDetalle({
    userId: profile?.id,
    bonoType,
  })

  // ── Validate bonoType ──
  if (!label) {
    return <NotFoundCard />
  }

  // ── Loading ──
  if (isLoading) {
    return <LoadingSkeleton />
  }

  const total = (commissions ?? []).reduce((sum, c) => sum + c.amount, 0)
  const displayCurrency = (commissions ?? [])[0]?.currency ?? 'MXN'

  // ── Render ──
  return (
    <div
      className="max-w-[1920px] mx-auto px-4 py-6"
      style={{ fontFamily: 'Poppins, sans-serif' }}
      data-testid="bono-detail-container"
    >
      {/* ── Back button ── */}
      <button
        type="button"
        onClick={() => navigate({ to: '/ganancias' })}
        className="flex items-center gap-1 mb-4 text-sm"
        style={{ color: '#383A3F' }}
      >
        <ArrowLeft size={16} />
        Volver
      </button>

      {/* ── Header card ── */}
      <div
        className="rounded-[24px] p-5 shadow-[0_4px_24px_rgba(6,42,99,0.07)] mb-4 bg-white"
        style={{ borderLeft: `3px solid ${color}` }}
      >
        <h1 className="text-xl font-bold" style={{ color: '#062A63' }}>
          {label}
        </h1>
        <p
          className="text-2xl font-bold mt-1"
          style={{ color: '#062A63' }}
          data-testid="bono-detail-total"
        >
          {formatCurrency(total, displayCurrency)}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
          {(commissions ?? []).length} {(commissions ?? []).length === 1 ? 'transacción' : 'transacciones'}
        </p>
      </div>

      {/* ── Empty state ── */}
      {(!commissions || commissions.length === 0) && (
        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)] p-8 text-center" data-testid="bono-detail-empty">
          <p className="text-sm" style={{ color: '#9CA3AF' }}>
            Sin transacciones para este bono
          </p>
        </div>
      )}

      {/* ── Transactions table ── */}
      {commissions && commissions.length > 0 && (
        <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)] overflow-hidden">
          {/* Table header */}
          <div
            className="grid grid-cols-[1fr_120px_100px_100px_80px_140px] items-center px-4 py-2.5 text-xs uppercase tracking-wide gap-x-2"
            style={{ backgroundColor: '#F2F4F9', color: '#9CA3AF' }}
          >
            <span>Origen</span>
            <span className="text-center"># Orden</span>
            <span className="text-right">PV</span>
            <span className="text-right">CV</span>
            <span className="text-right">%</span>
            <span className="text-right">Monto</span>
          </div>

          {/* Table rows */}
          {commissions.map((c) => {
            const pct = c.percentage

            return (
              <div
                key={c.commission_id}
                className="grid grid-cols-[1fr_120px_100px_100px_80px_140px] items-center px-4 py-2.5 border-b border-[#EAECF0] last:border-0 text-sm gap-x-2"
                style={{ color: '#383A3F' }}
                data-testid={`bono-detail-transaction-${c.commission_id}`}
              >
                {/* Origen — source_name ya viene "Nombre Apellidos" del RPC */}
                <span className="truncate" title={c.source_name}>
                  {c.source_name || '—'}
                </span>

                {/* # Orden — código legible */}
                <span className="text-center font-mono text-xs text-[#0CBCE5]">
                  {c.source_order_code || '—'}
                </span>

                {/* PV */}
                <span className="text-right">
                  {c.pv.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>

                {/* CV */}
                <span className="text-right">
                  {c.cv.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>

                {/* % */}
                <span className="text-right text-xs text-[#9CA3AF]">
                  {pct != null ? `${pct.toFixed(1)}%` : '—'}
                </span>

                {/* Monto + currency badge */}
                <span className="text-right font-semibold text-[#062A63] flex items-center justify-end gap-1">
                  {formatCurrency(c.amount, c.currency)}
                  <CurrencyBadge currency={c.currency} />
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
