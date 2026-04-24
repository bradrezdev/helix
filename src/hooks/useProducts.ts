import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface Product {
  code: string
  name: string
  pv: number
  cv: number
  price_socio_mxn: number
  price_public_mxn: number
  short_description: string | null
  description: string | null
  image_url: string | null
  activos: string | null
  cantidad: string | null
  active: boolean
  stock: number
}

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('code,name,pv,cv,price_socio_mxn,price_public_mxn,short_description,description,image_url,activos,cantidad,active,stock')
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
