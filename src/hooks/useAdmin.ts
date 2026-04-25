import { useAuth } from './useAuth'
import { useProfile } from './useProfile'

/**
 * Returns true if the current authenticated user has is_admin === true in their profile.
 */
export function useIsAdmin(): boolean {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id ?? '')
  return profile?.is_admin === true
}
