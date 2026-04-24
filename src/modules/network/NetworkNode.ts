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

export const RANK_COLORS: Record<string, string> = {
  Socio: '#9CA3AF',
  Bronce: '#B45309',
  Plata: '#6B7280',
  Oro: '#D97706',
  Platino: '#7C3AED',
  Diamante: '#0284C7',
  'Doble Diamante': '#0369A1',
  'Triple Diamante': '#1E3A8A',
  'Diamante Embajador': '#062A63',
}

export function getRankColor(rank: string): string {
  return RANK_COLORS[rank] ?? '#9CA3AF'
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase()
}
