import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'

export interface TankMember {
  member_id: string
  member_name: string
  member_email: string
  member_user_id: number
  sponsor_id: string
  entered_at: string
  days_waiting: number
}

export function useHoldingTank(userId: string | undefined) {
  return useQuery({
    queryKey: ['holding-tank', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('holding_tank')
        .select(`
          member_id,
          sponsor_id,
          entered_at,
          member:users!holding_tank_member_id_fkey(user_id, name, email)
        `)
        .eq('sponsor_id', userId!)
        .order('entered_at', { ascending: true })

      return ((data ?? []) as any[]).map(r => ({
        member_id: r.member_id,
        member_name: r.member?.name ?? '—',
        member_email: r.member?.email ?? '—',
        member_user_id: r.member?.user_id ?? 0,
        sponsor_id: r.sponsor_id,
        entered_at: r.entered_at,
        days_waiting: Math.floor((Date.now() - new Date(r.entered_at).getTime()) / (1000 * 60 * 60 * 24)),
      })) as TankMember[]
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}
