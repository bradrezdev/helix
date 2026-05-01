// ─── DashboardTier1 ───────────────────────────────────────────────────────────
// Tier 1 dashboard: Socio, Bronce, Plata.
// Widgets: StatCard (PV), NetworkCard (simplified), ProgressRankCard, ReferralLinkCard.
// No wallet, no commission breakdown, no trend chart.

import { useDashboard } from '../../hooks/useDashboard'
import { useLegVolumes } from '../../hooks/useNegocio'
import { TIER_1_RANKS, TIER_2_RANKS } from '../../hooks/useTier'
import type { UserProfile } from '../../hooks/useProfile'
import { StatCard } from '../../components/dashboard/widgets/StatCard'
import { NetworkCard } from '../../components/dashboard/widgets/NetworkCard'
import { ProgressRankCard } from '../../components/dashboard/widgets/ProgressRankCard'
import { ReferralLinkCard } from '../../components/dashboard/widgets/ReferralLinkCard'
import { TopRecruitersCard } from '../../components/dashboard/widgets/TopRecruitersCard'
import { TopConsumersCard } from '../../components/dashboard/widgets/TopConsumersCard'
import { FirstVsRepurchaseCard } from '../../components/dashboard/widgets/FirstVsRepurchaseCard'
import { DashboardPageSkeleton } from '../../components/dashboard/widgets/WidgetSkeleton'

// ─── RANK_PV_THRESHOLDS ───────────────────────────────────────────────────────
// Minimum PV required to reach each rank.
export const RANK_PV_THRESHOLDS: Record<string, number> = {
  'Socio': 0,
  'Bronce': 100,
  'Plata': 300,
  'Oro': 600,
  'Platino': 1000,
  'Diamante': 2000,
  'Doble Diamante': 4000,
  'Triple Diamante': 7000,
  'Diamante Embajador': 10000,
  'Doble Diamante Embajador': 15000,
  'Triple Diamante Embajador': 20000,
}

const RANK_ORDER = [
  'Socio',
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

function getRankTierLabel(rank: string): string {
  if ((TIER_1_RANKS as readonly string[]).includes(rank)) return ''
  if ((TIER_2_RANKS as readonly string[]).includes(rank)) return rank
  return rank
}

interface DashboardTier1Props {
  profile: UserProfile
}

export function DashboardTier1({ profile }: DashboardTier1Props) {
  const { data: dashboard, isLoading } = useDashboard(profile.id)
  const { data: legData } = useLegVolumes(profile.id)

  if (isLoading) return <DashboardPageSkeleton />

  const personalPv = dashboard?.personal_pv ?? 0
  const groupVg = dashboard?.group_vg ?? 0
  const currentRank = profile.rank ?? 'Socio'
  const nextRank = getNextRank(currentRank)
  const progressPercent = getRankProgress(currentRank, personalPv)
  const daysLeft = dashboard?.days_left_in_month ?? getDaysLeftInMonth()
  const totalPeople = dashboard?.active_directs

  const legs = (legData ?? []).map((l) => ({ name: l.direct_name, volume: l.leg_volume }))

  // Rank badge for subtitle (T1 doesn't show badge, just name)
  const rankTierLabel = getRankTierLabel(currentRank)

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Page header */}
      <div className="rounded-[32px] bg-[#062A63] p-6 text-white">
        <h1 className="font-[Poppins,sans-serif] text-2xl font-bold leading-tight">
          Mi Oficina
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Bienvenido, {profile.name}
        </p>
        {rankTierLabel && (
          <span className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
            {rankTierLabel}
          </span>
        )}
      </div>

      {/* PV Personal */}
      <StatCard
        label="PV Personal"
        value={personalPv.toLocaleString('es-MX')}
        isLoading={false}
      />

      {/* Network Card — simplified (group_vg from profile, no RPC) */}
      <NetworkCard
        simplified={true}
        groupVg={dashboard?.group_vg ?? 0}
        totalPeople={totalPeople}
        isLoading={false}
      />

      {/* Rank Progress */}
      <ProgressRankCard
        currentRank={currentRank}
        nextRank={nextRank}
        progressPercent={progressPercent}
        daysLeftInMonth={daysLeft}
        personalPv={personalPv}
        groupVg={groupVg}
        legs={legs}
        isLoading={false}
      />

      {/* Referral Link */}
      <ReferralLinkCard
        userId={profile.user_id}
        isLoading={false}
      />

      {/* New widgets */}
      <TopRecruitersCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
      <TopConsumersCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
      <FirstVsRepurchaseCard userId={profile.id} isAdmin={profile.is_admin ?? false} />
    </div>
  )
}
