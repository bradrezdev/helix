import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'
import { getVisibleProducts } from '../utils/productWhitelist.ts'
import type { Product, UserProfile } from '../utils/productWhitelist.ts'

export function useProductWhitelist(userId: string | undefined, user: UserProfile | null) {
  const qc = useQueryClient()

  const prodQ = useQuery({
    queryKey: ['products-whitelist', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('code, name, category, is_kit, status, price_socio_mxn, price_public_mxn')
        .neq('status', 'no_disponible')
        .order('name')
      return (data ?? []) as Product[]
    },
    enabled: !!userId,
  })

  const kitQ = useQuery({
    queryKey: ['user-has-kit', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .eq('is_kit', true)
        .eq('status', 'paid')
      return (count ?? 0) > 0
    },
    enabled: !!userId,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['products-whitelist', userId] })
    qc.invalidateQueries({ queryKey: ['user-has-kit', userId] })
    qc.invalidateQueries({ queryKey: ['kit-eligibility', userId] })
  }

  return {
    products: prodQ.data ? getVisibleProducts(prodQ.data, user, kitQ.data ?? false) : [],
    isLoading: prodQ.isLoading,
    invalidateCache: invalidate,
    hasPurchasedKit: kitQ.data ?? false,
  }
}
