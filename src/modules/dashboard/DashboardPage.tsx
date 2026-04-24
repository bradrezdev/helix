import { useState } from 'react'
import { useDashboard } from '../../hooks/useDashboard'
import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { useWalletDetails } from '../../hooks/useWalletDetails'
import { GlanceCard, GlanceCardSkeleton, RankProgressCard } from '../../components/glance-cards'
import { Greeting } from './components/greeting'
import { DashboardHero } from './components/hero'
import { Title } from './components/title'

// ─── Rank helpers ─────────────────────────────────────────────────────────────

const NEXT_RANK_VG: Record<string, number> = {
  'Socio': 0,
  'Ejecutivo': 1000,
  'Bronce': 3000,
  'Plata': 5000,
  'Oro': 10000,
  'Platino': 25000,
  'Diamante': 50000,
  'Doble Diamante': 100000,
  'Triple Diamante': 250000,
  'Diamante Embajador': 500000,
  'Doble Diamante Embajador': 1000000,
  'Triple Diamante Embajador': Infinity,
}

const RANK_ORDER = [
  'Socio',
  'Ejecutivo',
  'Bronce',
  'Plata',
  'Oro',
  'Platino',
  'Diamante',
  'Doble Diamante',
  'Triple Diamante',
  'Diamante Embajador',
  'Doble Diamante Embajador',
  'Triple Diamante Embajador',
]

function getNextRank(currentRank: string): { nextRank: string; vgTarget: number } {
  const idx = RANK_ORDER.indexOf(currentRank)
  if (idx === -1 || idx === RANK_ORDER.length - 1) return { nextRank: 'Máximo', vgTarget: Infinity }
  const nextRank = RANK_ORDER[idx + 1]
  return { nextRank, vgTarget: NEXT_RANK_VG[nextRank] }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-MX').format(value)
}

// ─── Dashboard Error ──────────────────────────────────────────────────────────

function DashboardError({ message }: { message: string }) {
  return (
    <div className="rounded-[32px] bg-red-50 border border-red-200 p-4 text-sm text-red-600">
      <strong>Error al cargar datos:</strong> {message}
    </div>
  )
}

// ─── ReferralLinkCard ─────────────────────────────────────────────────────────

function ReferralLinkCard({ userId }: { userId: number | undefined }) {
  const [copied, setCopied] = useState(false)
  const link = userId ? `ref-${userId}` : '—'

  function handleCopy() {
    if (!userId) return
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="bg-white rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-[#383A3F] mb-0.5">Tu enlace de referido</p>
        <p className="text-sm font-semibold text-[#062A63] truncate">{link}</p>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold text-white transition-all active:scale-95"
        style={{ background: copied ? '#32D74B' : '#0CBCE5' }}
      >
        {copied ? 'Copiado ✓' : 'Copiar'}
      </button>
    </div>
  )
}

// ─── WalletMovements ──────────────────────────────────────────────────────────

function txTypeIcon(type: string): string {
  if (type === 'order_payment') return '💳'
  if (type === 'commission_payout') return '⬆️'
  if (type === 'refund') return '↩️'
  return '➕' // manual_credit, bonus
}

function WalletMovements() {
  const { transactions, loading } = useWalletDetails()
  const last5 = transactions.slice(0, 5)

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 rounded-[14px] bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if (last5.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Sin movimientos recientes
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {last5.map((tx) => {
        const isPositive = tx.amount >= 0
        return (
          <div key={tx.id} className="flex items-center gap-3">
            <span className="text-base shrink-0">{txTypeIcon(tx.type)}</span>
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-medium truncate"
                style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
              >
                {tx.description ?? tx.type}
              </p>
              <p className="text-[10px] text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {new Date(tx.created_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
              </p>
            </div>
            <span
              className="text-xs font-semibold shrink-0"
              style={{
                color: isPositive ? '#32D74B' : '#FF3B30',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {isPositive ? '+' : ''}
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(tx.amount)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── FinancialSummarySection ──────────────────────────────────────────────────

interface FinancialSummaryProps {
  commissions: number
  withdrawable: number
  total: number
}

function FinancialSummarySection({ commissions, withdrawable, total }: FinancialSummaryProps) {
  const pills = [
    { label: 'Comisiones del mes', value: formatCurrency(commissions) },
    { label: 'Retiros disponibles', value: formatCurrency(withdrawable) },
    { label: 'Total acumulado', value: formatCurrency(total) },
  ]

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {pills.map((pill) => (
          <div
            key={pill.label}
            className="flex-1 min-w-[120px] bg-white rounded-full shadow-[0_2px_12px_rgba(6,42,99,0.07)] px-4 py-3 flex flex-col items-center whitespace-nowrap"
          >
            <p className="text-[10px] text-gray-500 mb-0.5 text-center leading-tight">{pill.label}</p>
            <p className="text-sm font-bold text-[#062A63]">{pill.value}</p>
          </div>
        ))}
      </div>
      {/* Wallet transactions */}
      <div
        className="bg-white rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-4"
        style={{ border: '1px solid #EAECF0' }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'rgba(56,58,63,0.60)', fontFamily: 'Poppins, sans-serif' }}
        >
          Últimos movimientos
        </p>
        <WalletMovements />
      </div>
    </div>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? ''
  const { data: profile } = useProfile(userId)
  const userName = profile?.name?.split(' ')[0] ?? user?.user_metadata?.name?.split(' ')[0] ?? user?.email ?? ''

  const { data, isLoading, isError, error } = useDashboard(userId)

  const isDataLoading = authLoading || isLoading

  // Rank progress
  const rankInfo = data ? getNextRank(data.rank) : { nextRank: '', vgTarget: 0 }

  return (
    <main className="bg-[#F2F4F9] min-h-screen font-[Poppins,sans-serif]">
      {/* Hero */}
      <section className="dashboard-hero-container relative">
        <DashboardHero />
        <Greeting name={userName} />
      </section>

      {/* Content */}
      <section className="my-8 px-5 space-y-4">
        <Title />

        {/* Error state */}
        {isError && (
          <DashboardError message={(error as Error)?.message ?? 'Error desconocido'} />
        )}

        {/* Top KPI row: PV Personal (filled green) + Rank/Level (filled blue) */}
        <div className="grid grid-cols-2 gap-3">
          {isDataLoading ? (
            <>
              <GlanceCardSkeleton />
              <GlanceCardSkeleton />
            </>
          ) : data ? (
            <>
              {/* PV Personal — filled green */}
              <GlanceCard
                title="PV Personal"
                value={formatNumber(data.personal_pv)}
                subtitle="Puntos de volumen personal"
                variant="filled"
                accentColor="success"
              />
              {/* Rank — filled blue */}
              <GlanceCard
                title="Rango actual"
                value={data.rank}
                subtitle="Nivel de calificación"
                variant="filled"
                accentColor="primary"
              />
            </>
          ) : null}
        </div>

        {/* Secondary KPI row: VG Grupal + CV Personal (filled blue) */}
        <div className="grid grid-cols-2 gap-3">
          {isDataLoading ? (
            <>
              <GlanceCardSkeleton />
              <GlanceCardSkeleton />
            </>
          ) : data ? (
            <>
              <GlanceCard
                title="VG Grupal"
                value={formatNumber(data.group_vg)}
                subtitle="Volumen grupal del mes"
                variant="filled"
                accentColor="primary"
              />
              <GlanceCard
                title="CV Personal"
                value={formatNumber(data.personal_cv)}
                subtitle="Volumen personal del mes"
                accent="secondary"
              />
            </>
          ) : null}
        </div>

        {/* Financial summary pills */}
        {!isDataLoading && data && (
          <FinancialSummarySection
            commissions={data.total_commissions_month}
            withdrawable={0}
            total={data.total_commissions_month}
          />
        )}

        {/* Referral link */}
        <ReferralLinkCard userId={profile?.user_id} />

        {/* White cards: Directs + Fidelity */}
        {!isDataLoading && data && (
          <div className="grid grid-cols-2 gap-3">
            <GlanceCard
              title="Directs activos"
              value={data.active_directs}
              subtitle="Distribuidores activos directos"
              accent="neutral"
            />
            <GlanceCard
              title="Puntos fidelidad"
              value={formatNumber(data.fidelity_points)}
              subtitle="Puntos acumulados"
              accent="neutral"
            />
          </div>
        )}

        {/* Rank progress */}
        <div>
          {isDataLoading ? (
            <div className="rounded-[32px] bg-white border border-[#EAECF0] p-4 h-24 animate-pulse" />
          ) : data ? (
            <RankProgressCard
              currentVg={data.group_vg}
              targetVg={rankInfo.vgTarget}
              nextRank={rankInfo.nextRank}
              daysLeft={13}
            />
          ) : null}
        </div>
      </section>
    </main>
  )
}
