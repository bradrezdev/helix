import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'

export interface Product {
  code: string
  name: string
  pv: number
  cv: number
  stock: number
  active: boolean
  product_status: string
  categoria_id: string | null
  is_recommended: boolean
  launched_at: string | null
  protected_password: string | null
  is_kit: boolean
  kit_type: string | null
  cantidad: string | null
  image_url: string | null
  short_description: string | null
  description: string | null
  activos: string | null
  price_socio_mxn: number | null
  price_public_mxn: number | null
  price_promotor_mxn: number | null
  price_socio_usd: number | null
  price_public_usd: number | null
  price_promotor_usd: number | null
  price_socio_cop: number | null
  price_public_cop: number | null
  price_promotor_cop: number | null
  price_socio_eur: number | null
  price_public_eur: number | null
  price_promotor_eur: number | null
}

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

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('active', true)
    .order('name')

  if (error) throw error
  return (data ?? []) as Product[]
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 10,
  })
}
