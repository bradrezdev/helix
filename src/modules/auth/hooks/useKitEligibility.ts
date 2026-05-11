import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase.ts'

export function useKitEligibility(userId: string | undefined) {
  const query = useQuery({
    queryKey: ['kit-eligibility', userId],
    queryFn: async (): Promise<boolean> => {
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('is_kit', true)
        .eq('status', 'paid')

      if (error) throw error
      return (count ?? 0) > 0
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  return {
    hasKit: query.data ?? false,
    loading: query.isLoading,
    isLoading: query.isLoading,
  }
}
