import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/modules/auth/hooks/useAuth'

export function usePurchasedKits() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['purchased-kits', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_items!inner(product_code)
        `)
        .eq('user_id', user.id)
        .in('status', ['paid', 'en_proceso'])
        .not('order_items', 'is', null)

      if (error) throw error

      // Extract unique purchased product codes
      const codes = new Set<string>()
      data?.forEach((order) => {
        const items = (order as { order_items?: Array<{ product_code: string | null }> }).order_items
        items?.forEach((item) => {
          if (item.product_code) codes.add(item.product_code)
        })
      })

      return Array.from(codes)
    },
    staleTime: 1000 * 60 * 5,
  })
}
