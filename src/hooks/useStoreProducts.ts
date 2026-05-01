import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Product } from './useProducts'

const PRODUCT_SELECT = [
  'code',
  'name',
  'pv',
  'cv',
  'stock',
  'active',
  'product_status',
  'categoria_id',
  'is_recommended',
  'launched_at',
  'protected_password',
  'is_kit',
  'kit_type',
  'cantidad',
  'image_url',
  'short_description',
  'description',
  'activos',
  'price_socio_mxn',
  'price_public_mxn',
  'price_promotor_mxn',
  'price_socio_usd',
  'price_public_usd',
  'price_promotor_usd',
  'price_socio_cop',
  'price_public_cop',
  'price_promotor_cop',
  'price_socio_eur',
  'price_public_eur',
  'price_promotor_eur',
].join(',')

export interface UseStoreProductsOpts {
  kitOnly?: boolean
}

export function useStoreProducts(opts: UseStoreProductsOpts = {}) {
  const { kitOnly = false } = opts

  return useQuery({
    queryKey: ['store-products', { kitOnly }],
    queryFn: async (): Promise<Product[]> => {
      let query = supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .order('name')

      if (kitOnly) {
        query = query.eq('is_kit', true).neq('product_status', 'no_disponible')
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Product[]
    },
    staleTime: 1000 * 60 * 5,
  })
}
