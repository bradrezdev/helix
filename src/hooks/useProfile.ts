import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface UserProfile {
  id: string
  user_id: number
  name: string
  apellidos: string | null
  email: string
  rank: string
  sponsor_id: string | null
  enrollment_date: string
  created_at: string
  link_referido: string | null
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
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, user_id, name, apellidos, email, rank, sponsor_id, enrollment_date, created_at, link_referido')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data as UserProfile
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSponsor(sponsorId: string | null | undefined) {
  return useQuery({
    queryKey: ['profile', 'sponsor', sponsorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, user_id, name, apellidos, email, rank')
        .eq('id', sponsorId!)
        .single()
      if (error) throw error
      return data as SponsorProfile
    },
    enabled: !!sponsorId,
    staleTime: 5 * 60 * 1000,
  })
}
