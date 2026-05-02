import { RANK_COLORS } from '../../lib/ranks'

export interface NetworkNode {
  id: string
  parentId: string | null
  name: string
  rank: string
  isActive: boolean
  personalCv: number
  personalPv: number
  groupVg: number
  kitType: string | null
  levelDepth: number
}

export type TreeType = 'unilevel' | 'sponsor'

export function getRankColor(rank: string): string {
  return RANK_COLORS[rank] ?? '#9CA3AF'
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}
