import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface UserProfile {
  id: string
  user_id: number
  name: string
  apellidos: string | null
  email: string
  rank: string
  membership: string | null
  sponsor_id: string | null
  enrollment_date: string
  created_at: string
  link_referido: string | null
  is_admin: boolean | null
  country: string
}

export interface SponsorProfile {
  id: string
  user_id: number
  name: string
  apellidos: string | null
  email: string
  rank: string
}

export function useProfile(userId: string) {
  const query = useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, user_id, name, apellidos, email, rank, membership, sponsor_id, enrollment_date, created_at, link_referido, is_admin, country')
        .eq('id', userId)
        .maybeSingle()
      // maybeSingle() returns null instead of 406 when no row found
      if (error) throw error
      if (!data) return null
      const raw = data as Omit<UserProfile, 'country'> & { country: string | null }
      return { ...raw, country: raw.country ?? 'MX' } as UserProfile
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
  return {
    data: query.data,
    profile: query.data,
    loading: query.isLoading,
    isLoading: query.isLoading,
    error: query.error,
  }
}

export function useSponsor(sponsorId: string | null | undefined) {
  return useQuery({
    queryKey: ['profile', 'sponsor', sponsorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, user_id, name, apellidos, email, rank')
        .eq('id', sponsorId!)
        .maybeSingle()
      if (error) throw error
      return data as SponsorProfile | null
    },
    enabled: !!sponsorId,
    staleTime: 5 * 60 * 1000,
  })
}
