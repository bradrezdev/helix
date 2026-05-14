import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase.ts'

export interface RecentRegistration {
  id: string
  name: string
  rank: string
  kit_type: string | null
  enrollment_date: string | null
  is_active: boolean
  sponsor_id: string | null
}

export function useRecentRegistrations(userNumId: number | undefined) {
  return useQuery({
    queryKey: ['recent-registrations', userNumId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, rank, kit_type, enrollment_date, is_active, sponsor_id')
        .eq('sponsor_id', userNumId!)
        .order('enrollment_date', { ascending: false })
        .limit(10)
      if (error) throw error
      return (data ?? []) as RecentRegistration[]
    },
    enabled: !!userNumId,
    staleTime: 5 * 60 * 1000,
  })
}
