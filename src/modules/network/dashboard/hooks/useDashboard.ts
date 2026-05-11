import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api'

export function useDashboard(userId: string) {
  return useQuery({
    queryKey: ['dashboard', userId],
    queryFn: () => getDashboard(userId),
    staleTime: 1000 * 60 * 2,
    enabled: !!userId,
  })
}
