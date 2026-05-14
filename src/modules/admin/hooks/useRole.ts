import { useProfile } from '../../auth/hooks/useProfile'
import { useAuth } from '../../auth/hooks/useAuth'

type EffectiveRole = 'admin' | 'supervisor' | 'support' | 'user'

export function useRole() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id ?? '')

  const effectiveRole: EffectiveRole = profile?.is_admin
    ? 'admin'
    : profile?.is_supervisor
      ? 'supervisor'
      : profile?.is_support
        ? 'support'
        : 'user'

  const canAccessAdmin = effectiveRole !== 'user'
  const canAssignRoles = effectiveRole === 'admin'
  const isReadOnly = effectiveRole === 'support'

  return { effectiveRole, canAccessAdmin, canAssignRoles, isReadOnly }
}
