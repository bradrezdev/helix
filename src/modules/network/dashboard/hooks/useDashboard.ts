import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api'

export function useDashboard(userId: string) {
  return useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => getDashboard(userId),
    staleTime: 1000 * 30, // 30 seconds — rank progress needs fresh data after purchase
    enabled: !!userId,
  })
}
