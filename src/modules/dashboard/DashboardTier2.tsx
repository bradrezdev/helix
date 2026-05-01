// ─── DashboardTier2 ───────────────────────────────────────────────────────────
// Tier 2 dashboard: Oro, Platino, Diamante.
// Adds: full NetworkCard, CommissionBreakdownCard, WalletCard.

import { useNavigate } from '@tanstack/react-router'
import { useDashboard } from '../../hooks/useDashboard'
import { useNetworkStats, useCommissionBreakdown, useLegVolumes } from '../../hooks/useNegocio'
import { useWallet } from '../../hooks/useWallet'
import type { UserProfile } from '../../hooks/useProfile'
import { StatCard } from '../../components/dashboard/widgets/StatCard'
import { NetworkCard } from '../../components/dashboard/widgets/NetworkCard'
import { CommissionBreakdownCard } from '../../components/dashboard/widgets/CommissionBreakdownCard'
import { WalletCard } from '../../components/dashboard/widgets/WalletCard'
import { ProgressRankCard } from '../../components/dashboard/widgets/ProgressRankCard'
import { DashboardPageSkeleton } from '../../components/dashboard/widgets/WidgetSkeleton'
import { TopRankosCard } from '../../components/dashboard/widgets/TopRankosCard'
import { TopConsumersCard } from '../../components/dashboard/widgets/TopConsumersCard'
import { TopRecruitersCard } from '../../components/dashboard/widgets/TopRecruitersCard'
import { FirstVsRepurchaseCard } from '../../components/dashboard/widgets/FirstVsRepurchaseCard'
import { EarningsCard } from '../../components/dashboard/widgets/EarningsCard'
import { RANK_PV_THRESHOLDS } from './DashboardTier1'

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

interface DashboardTier2Props {
  profile: UserProfile
}

export function DashboardTier2({ profile }: DashboardTier2Props) {
  const navigate = useNavigate()
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const { data: dashboard, isLoading: dashLoading } = useDashboard(profile.id)
  const { data: networkStats, isLoading: networkLoading } = useNetworkStats(profile.id)
  const { data: legData } = useLegVolumes(profile.id)
  const { data: breakdownItems, isLoading: breakdownLoading } = useCommissionBreakdown(
    profile.id,
    currentMonth,
    currentYear,
  )
  const { wallets, loading: walletLoading } = useWallet(profile.id)

  if (dashLoading) return <DashboardPageSkeleton />

  const personalPv = dashboard?.personal_pv ?? 0
  const groupVg = dashboard?.group_vg ?? 0
  const currentRank = profile.rank ?? 'Oro'
  const nextRank = getNextRank(currentRank)
  const progressPercent = getRankProgress(currentRank, personalPv)
  const daysLeft = dashboard?.days_left_in_month ?? getDaysLeftInMonth()

  const legs = (legData ?? []).map((l) => ({ name: l.direct_name, volume: l.leg_volume }))

  const firstWallet = wallets[0]

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
        <div className="mt-2 flex items-center gap-2">
          <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            {currentRank}
          </span>
        </div>
      </div>

      {/* PV Personal */}
      <StatCard
        label="PV Personal"
        value={personalPv.toLocaleString('es-MX')}
      />

      {/* Network Card — full stats */}
      <NetworkCard
        simplified={false}
        groupVg={networkStats?.sponsor_total !== undefined ? dashboard?.group_vg : undefined}
        totalPeople={networkStats?.sponsor_total}
        percentActive={percentActive}
        directs={networkStats?.sponsor_directs}
        isLoading={networkLoading}
      />

      {/* Commission Breakdown */}
      <CommissionBreakdownCard
        items={breakdownItems}
        currency={profile.country}
        isLoading={breakdownLoading}
      />

      {/* Wallet Card — hidden if no wallet */}
      {(walletLoading || firstWallet) && (
        <WalletCard
          balance={firstWallet?.balance ?? 0}
          currency={firstWallet?.currency ?? profile.country}
          onWithdraw={() => navigate({ to: '/billetera' })}
          isLoading={walletLoading}
        />
      )}

      {/* Rank Progress */}
      <ProgressRankCard
        currentRank={currentRank}
        nextRank={nextRank}
        progressPercent={progressPercent}
        daysLeftInMonth={daysLeft}
        personalPv={personalPv}
        groupVg={groupVg}
        legs={legs}
      />

      {/* New widgets */}
      <TopRankosCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
      <TopConsumersCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
      <TopRecruitersCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
      <FirstVsRepurchaseCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
      <EarningsCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
    </div>
  )
}
