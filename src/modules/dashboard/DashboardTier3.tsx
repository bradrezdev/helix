// ─── DashboardTier3 ───────────────────────────────────────────────────────────
// Tier 3 dashboard: Doble Diamante and above.
// Adds: commissions YTD, VgTrendChart, rank distribution (Zod-parsed).

import { useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { useDashboard } from '../../hooks/useDashboard'
import { useNetworkStats, useCommissionBreakdown, useVgTrend, useLegVolumes } from '../../hooks/useNegocio'
import { useWallet } from '../../hooks/useWallet'
import type { UserProfile } from '../../hooks/useProfile'
import { StatCard } from '../../components/dashboard/widgets/StatCard'
import { NetworkCard } from '../../components/dashboard/widgets/NetworkCard'
import { CommissionBreakdownCard } from '../../components/dashboard/widgets/CommissionBreakdownCard'
import { WalletCard } from '../../components/dashboard/widgets/WalletCard'
import { ProgressRankCard } from '../../components/dashboard/widgets/ProgressRankCard'
import { VgTrendChart } from '../../components/dashboard/widgets/VgTrendChart'
import { DashboardPageSkeleton } from '../../components/dashboard/widgets/WidgetSkeleton'
import { TopRankosCard } from '../../components/dashboard/widgets/TopRankosCard'
import { TopConsumersCard } from '../../components/dashboard/widgets/TopConsumersCard'
import { TopRecruitersCard } from '../../components/dashboard/widgets/TopRecruitersCard'
import { FirstVsRepurchaseCard } from '../../components/dashboard/widgets/FirstVsRepurchaseCard'
import { EarningsCard } from '../../components/dashboard/widgets/EarningsCard'
import { formatAmount } from '../../lib/formatters'
import { RANK_PV_THRESHOLDS } from './DashboardTier1'

// ─── Zod schema for rank_distribution ────────────────────────────────────────
const RankDistributionSchema = z.record(z.string(), z.number())

const RANK_ORDER = [
  'Socio', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante',
  'Doble Diamante', 'Triple Diamante', 'Diamante Embajador',
  'Doble Diamante Embajador', 'Triple Diamante Embajador',
]

function getNextRank(rank: string): string | null {
  const idx = RANK_ORDER.indexOf(rank)
  if (idx === -1 || idx === RANK_ORDER.length - 1) return null
  return RANK_ORDER[idx + 1]
}

function getRankProgress(rank: string, personalPv: number): number {
  const currentThreshold = RANK_PV_THRESHOLDS[rank] ?? 0
  const nextRank = getNextRank(rank)
  if (!nextRank) return 100
  const nextThreshold = RANK_PV_THRESHOLDS[nextRank] ?? currentThreshold
  if (nextThreshold <= currentThreshold) return 100
  const progress = ((personalPv - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  return Math.min(100, Math.max(0, progress))
}

function getDaysLeftInMonth(): number {
  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return lastDay - now.getDate()
}

interface DashboardTier3Props {
  profile: UserProfile
}

export function DashboardTier3({ profile }: DashboardTier3Props) {
  const navigate = useNavigate()
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const { data: dashboard, isLoading: dashLoading } = useDashboard(profile.id)
  const { data: networkStats, isLoading: networkLoading } = useNetworkStats(profile.id)
  const { data: breakdownItems, isLoading: breakdownLoading } = useCommissionBreakdown(
    profile.id,
    currentMonth,
    currentYear,
  )
  const { data: trendPoints, isLoading: trendLoading } = useVgTrend(profile.id, 6)
  const { data: legData } = useLegVolumes(profile.id)
  const { wallets, loading: walletLoading } = useWallet(profile.id)

  if (dashLoading) return <DashboardPageSkeleton />

  const personalPv = dashboard?.personal_pv ?? 0
  const groupVg = dashboard?.group_vg ?? 0
  const currentRank = profile.rank ?? 'Doble Diamante'
  const nextRank = getNextRank(currentRank)
  const progressPercent = getRankProgress(currentRank, personalPv)
  const daysLeft = dashboard?.days_left_in_month ?? getDaysLeftInMonth()

  const legs = (legData ?? []).map((l) => ({ name: l.direct_name, volume: l.leg_volume }))

  const firstWallet = wallets[0]
  const walletCurrency = firstWallet?.currency ?? profile.country

  // Commissions YTD — sum all trend points for current year
  const commissionsYtd = useMemo(() => {
    if (!trendPoints) return 0
    return trendPoints
      .filter((p) => p.year === currentYear)
      .reduce((sum, p) => sum + p.total, 0)
  }, [trendPoints, currentYear])

  // Zod-parsed rank_distribution — no `any` per REQ-7
  const rankDistribution = useMemo(() => {
    if (!networkStats?.rank_distribution) return null
    const result = RankDistributionSchema.safeParse(networkStats.rank_distribution)
    return result.success ? result.data : null
  }, [networkStats?.rank_distribution])

  // Active % for network
  const percentActive =
    networkStats && networkStats.sponsor_total > 0
      ? (networkStats.active_count / networkStats.sponsor_total) * 100
      : undefined

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Page header */}
      <div className="rounded-[32px] bg-[#062A63] p-6 text-white">
        <h1 className="font-[Poppins,sans-serif] text-2xl font-bold leading-tight">
          Mi Oficina
        </h1>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            {currentRank}
          </span>
          <span className="inline-block rounded-full bg-[#0CBCE5]/80 px-3 py-1 text-xs font-semibold text-white">
            Líder
          </span>
        </div>
      </div>

      {/* Stats row: PV + YTD */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="PV Personal"
          value={personalPv.toLocaleString('es-MX')}
        />
        <StatCard
          label="Comisiones YTD"
          value={formatAmount(commissionsYtd, walletCurrency)}
        />
      </div>

      {/* Network Card — full stats + rank distribution */}
      <NetworkCard
        simplified={false}
        groupVg={dashboard?.group_vg}
        totalPeople={networkStats?.sponsor_total}
        percentActive={percentActive}
        directs={networkStats?.sponsor_directs}
        isLoading={networkLoading}
      />

      {/* Rank distribution (T3 extra) */}
      {rankDistribution && Object.keys(rankDistribution).length > 0 && (
        <div className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5">
          <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif] mb-3">
            Distribución de rangos en red
          </p>
          <ul className="space-y-2">
            {Object.entries(rankDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([rank, count]) => (
                <li key={rank} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{rank}</span>
                  <span className="text-sm font-semibold text-[#062A63]">{count}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Commission Breakdown */}
      <CommissionBreakdownCard
        items={breakdownItems}
        currency={walletCurrency}
        isLoading={breakdownLoading}
      />

      {/* Wallet Card — hidden if no wallet */}
      {(walletLoading || firstWallet) && (
        <WalletCard
          balance={firstWallet?.balance ?? 0}
          currency={firstWallet?.currency ?? walletCurrency}
          onWithdraw={() => navigate({ to: '/billetera' })}
          isLoading={walletLoading}
        />
      )}

      {/* VG Trend Chart */}
      <VgTrendChart
        points={trendPoints ?? []}
        isLoading={trendLoading}
      />

      {/* New widgets */}
      <TopRankosCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
      <TopConsumersCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
      <TopRecruitersCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
      <FirstVsRepurchaseCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
      <EarningsCard userId={profile.id} isAdmin={profile.is_admin ?? false} />

      {/* Rank Progress (only if not max rank) */}
      {nextRank && (
        <ProgressRankCard
          currentRank={currentRank}
          nextRank={nextRank}
          progressPercent={progressPercent}
          daysLeftInMonth={daysLeft}
          personalPv={personalPv}
          groupVg={groupVg}
          legs={legs}
        />
      )}
    </div>
  )
}
