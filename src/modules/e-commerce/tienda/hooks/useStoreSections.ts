import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../../lib/supabase.ts'
import type { Product } from './useProducts.ts'
import { useAdminSettings } from '../../../admin/hooks/useAdminSettings.ts'

export interface Categoria {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
}

export interface StoreSections {
  novedades: Product[]
  recomendados: Product[]
  masPedidos: Product[]
  byCategoria: { categoria: Categoria; products: Product[] }[]
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

async function fetchStoreSections(novedadesMonths: number): Promise<StoreSections> {
  const novedadesDate = new Date()
  novedadesDate.setMonth(novedadesDate.getMonth() - novedadesMonths)
  const novedadesIso = novedadesDate.toISOString()

  const [novedadesResult, recomendadosResult, masPedidosRawResult, categoriasResult] =
    await Promise.all([
      // novedades: launched_at >= cutoff, ORDER BY launched_at DESC
      supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .gte('launched_at', novedadesIso)
        .order('launched_at', { ascending: false }),

      // recomendados: is_recommended=true AND disponible
      supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('is_recommended', true)
        .eq('product_status', 'disponible'),

      // masPedidos: SUM(quantity) via order_items+orders, top 10 product codes
      supabase
        .from('order_items')
        .select('product_code, quantity, orders!inner(status)')
        .eq('orders.status', 'paid'),

      // categorias + all products (excluding no_disponible)
      supabase
        .from('categorias')
        .select('id, nombre, slug, descripcion')
        .order('nombre'),
    ])

  if (novedadesResult.error) throw novedadesResult.error
  if (recomendadosResult.error) throw recomendadosResult.error
  if (masPedidosRawResult.error) throw masPedidosRawResult.error
  if (categoriasResult.error) throw categoriasResult.error

  // Compute masPedidos: aggregate SUM(quantity) by product_code
  const qtySums: Record<string, number> = {}
  for (const row of masPedidosRawResult.data ?? []) {
    const code = row.product_code as string
    const qty = (row.quantity as number) ?? 0
    qtySums[code] = (qtySums[code] ?? 0) + qty
  }

  const topCodes = Object.entries(qtySums)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([code]) => code)

  // Fetch top products if any
  let masPedidosProducts: Product[] = []
  if (topCodes.length > 0) {
    const { data: topData, error: topError } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .in('code', topCodes)
    if (topError) throw topError
    // Preserve rank order
    const byCode = new Map<string, Product>()
    for (const p of (topData ?? []) as Product[]) {
      byCode.set(p.code, p)
    }
    masPedidosProducts = topCodes.flatMap((c) => {
      const p = byCode.get(c)
      return p ? [p] : []
    })
  }

  // byCategoria: fetch all products (non no_disponible) then group
  const { data: allProducts, error: allError } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .neq('product_status', 'no_disponible')
    .order('name')

  if (allError) throw allError

  const productsByCategoria = new Map<string, Product[]>()
  for (const p of (allProducts ?? []) as Product[]) {
    if (!p.categoria_id) continue
    if (!productsByCategoria.has(p.categoria_id)) {
      productsByCategoria.set(p.categoria_id, [])
    }
    productsByCategoria.get(p.categoria_id)!.push(p)
  }

  const categorias = (categoriasResult.data ?? []) as Categoria[]
  const byCategoria = categorias
    .map((cat) => ({
      categoria: cat,
      products: productsByCategoria.get(cat.id) ?? [],
    }))
    .filter((section) => section.products.length > 0)

  return {
    novedades: (novedadesResult.data ?? []) as Product[],
    recomendados: (recomendadosResult.data ?? []) as Product[],
    masPedidos: masPedidosProducts,
    byCategoria,
  }
}

export function useStoreSections(novedadesMonths: number = 3) {
  const { settings, isLoading: settingsLoading } = useAdminSettings()

  const resolvedMonths = settingsLoading
    ? novedadesMonths
    : parseInt(settings['novedades_months'] ?? String(novedadesMonths), 10) || novedadesMonths

  const query = useQuery({
    queryKey: ['store-sections', resolvedMonths],
    queryFn: () => fetchStoreSections(resolvedMonths),
    enabled: !settingsLoading,
    staleTime: 1000 * 60 * 5,
  })

  return {
    sections: query.data ?? {
      novedades: [],
      recomendados: [],
      masPedidos: [],
      byCategoria: [],
    },
    loading: query.isLoading || settingsLoading,
    isLoading: query.isLoading || settingsLoading,
  }
}
