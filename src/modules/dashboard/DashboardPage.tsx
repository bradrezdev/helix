// ─── DashboardPage ────────────────────────────────────────────────────────────
// Tiered dashboard orchestrator. Detects tier from profile.rank and renders
// the correct DashboardTier1 | DashboardTier2 | DashboardTier3 component.
// Shows a full-page skeleton while useProfile (and auth) are resolving.

import { useAuth } from '../../hooks/useAuth'
import { useProfile } from '../../hooks/useProfile'
import { getTier } from '../../hooks/useTier'
import { DashboardPageSkeleton } from '../../components/dashboard/widgets/WidgetSkeleton'
import { DashboardTier1 } from './DashboardTier1'
import { DashboardTier2 } from './DashboardTier2'
import { DashboardTier3 } from './DashboardTier3'

export function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? ''

  const { profile, loading: profileLoading } = useProfile(userId)

  // Tier unknown until profile loads — show full-page skeleton
  if (authLoading || profileLoading) {
    return <DashboardPageSkeleton />
  }

  // No profile = unauthenticated (router guards should prevent this)
  if (!profile) {
    return null
  }

  const tier = getTier(profile.rank)

  if (tier === 1) return <DashboardTier1 profile={profile} />
  if (tier === 2) return <DashboardTier2 profile={profile} />
  return <DashboardTier3 profile={profile} />
}
