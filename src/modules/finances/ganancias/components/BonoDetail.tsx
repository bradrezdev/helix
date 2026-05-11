// ─── BonoDetail ───────────────────────────────────────────────────────────────
// Detail page for a specific bonus type reached via /ganancias/$bonoType.
// Shows a header summary card and a transaction table with order details.
//
// Intent: Distribuidor que hizo clic en una card de bono y quiere ver el detalle
//          de cada transacción — origen, orden, PV, CV, montos.
// Feel: Preciso tipo estado de cuenta bancario. Serio, confiable, ordenado.
//
// Palette: ONANO primary #062A63, accents from GANANCIAS_BONO_COLORS,
//          background #F2F4F9, border #EAECF0, muted #9CA3AF, text #383A3F.
// Depth: Subtle shadow on cards, no heavy elevations.
// Typography: Poppins everywhere, bold for numbers, regular for labels.

import { useParams, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../../auth/hooks/useAuth.ts'
import { useProfile } from '../../../auth/hooks/useProfile.ts'
import { supabase } from '../../../../lib/supabase.ts'
import { BONO_TYPE_LABELS } from '../../../../lib/formatters.ts'
import { getBonoColor } from '../constants.ts'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface CommissionDetail {
  id: string
  amount: number
  level: number | null
  calculated_at: string
  bono_type: string
  source_order_id: string | null
  source_user_id: string | null
  process_verified: boolean
  source_order: {
    order_id: string
    pv: number
    cv: number
    total_amount: number
  } | null
  source_user: {
    user_id: number
    name: string
    apellidos: string
  } | null
}

// ─── Bonus type display labels ──────────────────────────────────────────────────

const BONO_LABELS = BONO_TYPE_LABELS

// ─── Format helpers ─────────────────────────────────────────────────────────────

const currency = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

function formatCurrencyMXN(amount: number): string {
  return currency.format(amount)
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="max-w-[1920px] mx-auto px-4 py-6" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {/* Back button skeleton */}
      <div className="h-6 w-20 bg-[#F2F4F9] rounded mb-4 animate-pulse" />

      {/* Header card skeleton */}
      <div className="rounded-[24px] p-5 shadow-[0_4px_24px_rgba(6,42,99,0.07)] mb-4 animate-pulse">
        <div className="h-6 w-40 bg-[#F2F4F9] rounded mb-3" />
        <div className="h-8 w-48 bg-[#F2F4F9] rounded mb-2" />
        <div className="h-4 w-32 bg-[#F2F4F9] rounded" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-[24px] shadow-[0_4px_24px_rgba(6,42,99,0.07)] overflow-hidden">
        <div className="grid grid-cols-12 bg-[#F2F4F9] px-4 py-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-3 bg-[#E5E7EB] rounded animate-pulse" style={{ width: i <= 2 || i === 4 ? '64px' : '40px' }} />
          ))}
        </div>
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="grid grid-cols-12 px-4 py-3 border-b border-[#EAECF0] last:border-0">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((col) => (
              <div key={col} className="h-4 bg-[#F2F4F9] rounded animate-pulse" style={{ width: col <= 2 || col === 4 ? '64px' : '40px' }} />
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

// ─── Main component ─────────────────────────────────────────────────────────────

export default function BonoDetail() {
  const { bonoType } = useParams({ from: '/authenticated/ganancias/$bonoType' })
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? '')

  const label = BONO_LABELS[bonoType]
  const color = getBonoColor(bonoType)

  // ── Fetch commissions with order + user details for this bonus type ──
  const {
    data: commissions,
    isLoading,
  } = useQuery({
    queryKey: ['bono-detail', bonoType, profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('commissions')
        .select(`
          id, amount, level, calculated_at, bono_type,
          source_order_id, source_user_id, process_verified,
          source_order:orders!commissions_source_order_id_fkey(order_id, pv, cv, total_amount),
          source_user:users!commissions_source_user_id_fkey(user_id, name, apellidos)
        `)
        .eq('user_id', profile?.id)
        .eq('bono_type', bonoType)
        .order('calculated_at', { ascending: false })
      return (data ?? []) as unknown as CommissionDetail[]
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
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
        <h1
          className="text-xl font-bold"
          style={{ color: '#062A63' }}
        >
          {label}
        </h1>
        <p
          className="text-2xl font-bold mt-1"
          style={{ color: '#062A63' }}
          data-testid="bono-detail-total"
        >
          {formatCurrencyMXN(total)}
        </p>
        <p
          className="text-xs"
          style={{ color: '#9CA3AF' }}
        >
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
            className="grid grid-cols-12 px-4 py-2.5 text-xs uppercase tracking-wide gap-x-2"
            style={{ backgroundColor: '#F2F4F9', color: '#9CA3AF' }}
          >
            <span className="col-span-2">Origen</span>
            <span className="col-span-1">ID</span>
            <span className="col-span-3">Nombre Completo</span>
            <span className="col-span-2">Orden #</span>
            <span className="col-span-1 text-right">PV</span>
            <span className="col-span-1 text-right">CV</span>
            <span className="col-span-1 text-right">Monto</span>
            <span className="col-span-1 text-right">%</span>
          </div>

          {/* Table rows */}
          {commissions.map((c) => {
            const cv = c.source_order?.cv ?? 0
            const pct = cv > 0 ? (c.amount / cv) * 100 : 0
            const fullName = c.source_user
              ? `${c.source_user.name} ${c.source_user.apellidos}`
              : null

            return (
              <div
                key={c.id}
                className="grid grid-cols-12 px-4 py-2.5 border-b border-[#EAECF0] last:border-0 text-sm gap-x-2 items-center"
                style={{ color: '#383A3F' }}
                data-testid={`bono-detail-transaction-${c.id}`}
              >
                {/* Origen */}
                <span className="col-span-2 flex items-center gap-1.5 truncate">
                  {c.process_verified && (
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                  )}
                  {fullName ?? '\u2014'}
                </span>

                {/* ID — source user's bigint display ID */}
                <span className="col-span-1 font-mono text-xs">
                  {c.source_user?.user_id?.toString() ?? '\u2014'}
                </span>

                {/* Nombre Completo */}
                <span className="col-span-3 truncate">
                  {fullName ?? '\u2014'}
                </span>

                {/* Orden # */}
                <span className="col-span-2 truncate font-mono text-xs">
                  {c.source_order?.order_id ?? '\u2014'}
                </span>

                {/* PV */}
                <span className="col-span-1 text-right">
                  {c.source_order != null
                    ? Number(c.source_order.pv).toFixed(2)
                    : '\u2014'}
                </span>

                {/* CV */}
                <span className="col-span-1 text-right">
                  {c.source_order != null
                    ? Number(c.source_order.cv).toFixed(2)
                    : '\u2014'}
                </span>

                {/* Monto */}
                <span
                  className="col-span-1 text-right font-semibold"
                  style={{ color: '#062A63' }}
                >
                  {formatCurrencyMXN(c.amount)}
                </span>

                {/* % */}
                <span className="col-span-1 text-right text-xs">
                  {c.source_order != null && cv > 0
                    ? `${pct.toFixed(1)}%`
                    : '\u2014'}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
