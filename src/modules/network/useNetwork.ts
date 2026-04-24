import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { NetworkNode } from './NetworkNode'

interface RawNetworkNode {
  id: string
  name: string
  rank: string
  parent_id: string | null
  level_depth: number
  is_active: boolean
  personal_cv: number
  kit_type: string | null
}

interface NetworkStats {
  sponsor_directs: number
  sponsor_total: number
  unilevel_directs: number
  unilevel_total: number
  active_count: number
  rank_distribution: Record<string, number>
}

function transformNode(raw: RawNetworkNode): NetworkNode {
  return {
    id: raw.id,
    parentId: raw.parent_id,
    name: raw.name,
    rank: raw.rank,
    isActive: raw.is_active,
    personalCv: raw.personal_cv,
    kitType: raw.kit_type,
    levelDepth: raw.level_depth,
  }
}

export function useUnivelTree(userId: string, maxDepth = 3) {
  return useQuery({
    queryKey: ['network', 'unilevel', userId, maxDepth],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_unilevel_tree', {
        p_user_id: userId,
        p_max_depth: maxDepth,
      })
      if (error) throw error
      return (data as RawNetworkNode[]).map(transformNode)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useSponsorTree(userId: string, maxDepth = 3) {
  return useQuery({
    queryKey: ['network', 'sponsor', userId, maxDepth],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_sponsor_tree', {
        p_user_id: userId,
        p_max_depth: maxDepth,
      })
      if (error) throw error
      return (data as RawNetworkNode[]).map(transformNode)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useNetworkStats(userId: string) {
  return useQuery({
    queryKey: ['network', 'stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_network_stats', {
        p_user_id: userId,
      })
      if (error) throw error
      // get_network_stats returns an array; take the first row
      return (data as NetworkStats[])[0] ?? null
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
