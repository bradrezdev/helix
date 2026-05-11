export type PriceCountry = 'MXN' | 'USD' | 'COP' | 'EUR'
export type PriceMembership = 'socio' | 'public' | 'promotor'

/**
 * Maps a 2-letter country code to its currency code.
 * Falls back to 'MXN' for unknown countries.
 */
export function getCountryCurrency(country: string): string {
  const map: Record<string, string> = { MX: 'MXN', US: 'USD', CO: 'COP', ES: 'EUR' }
  return map[country.toUpperCase()] ?? 'MXN'
}

interface PricedProduct {
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

export function getProductPrice(
  product: PricedProduct,
  country: string | null | undefined,
  membership: string | null | undefined
): number {
  const c = (country ?? 'MXN').toUpperCase() as PriceCountry
  const m = (membership ?? 'socio').toLowerCase() as PriceMembership
  const suffix = `${m}_${c.toLowerCase()}` as keyof PricedProduct
  const price = product[suffix]
  if (price != null) return price
  // fallback chain: socio_mxn
  return product.price_socio_mxn ?? 0
}
