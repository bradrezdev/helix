import type { SupabaseClient } from '@supabase/supabase-js'

export interface TaxRow {
  country: string
  state: string | null
  rate: number
  label: string
}

// Maps currency codes used in the app to ISO 2-letter country codes
const CURRENCY_TO_COUNTRY: Record<string, string> = {
  MXN: 'MX',
  USD: 'US',
  COP: 'CO',
  EUR: 'ES',
}

/**
 * Normalize country input — accepts either ISO 2-letter ('MX') or
 * currency code ('MXN') and returns ISO 2-letter.
 */
export function normalizeCountry(country: string): string {
  if (country.length === 2) return country.toUpperCase()
  return CURRENCY_TO_COUNTRY[country.toUpperCase()] ?? country.toUpperCase()
}

/**
 * Sync: find tax rate from a pre-fetched taxes array.
 * Priority: country+state match first, then country+null fallback, else 0.
 */
export function getTaxRate(taxes: TaxRow[], country: string, state?: string): number {
  const iso = normalizeCountry(country)

  if (state) {
    const exact = taxes.find(
      (t) => t.country === iso && t.state === state
    )
    if (exact) return exact.rate
  }

  const fallback = taxes.find((t) => t.country === iso && t.state === null)
  return fallback?.rate ?? 0
}

/**
 * Sync: find tax label from a pre-fetched taxes array.
 */
export function getTaxLabel(taxes: TaxRow[], country: string, state?: string): string {
  const iso = normalizeCountry(country)

  if (state) {
    const exact = taxes.find(
      (t) => t.country === iso && t.state === state
    )
    if (exact) return exact.label
  }

  const fallback = taxes.find((t) => t.country === iso && t.state === null)
  return fallback?.label ?? 'Tax'
}

/**
 * Async: fetch tax rate directly from Supabase.
 */
export async function fetchTaxRate(
  supabase: SupabaseClient,
  country: string,
  state?: string
): Promise<number> {
  const iso = normalizeCountry(country)

  const { data, error } = await supabase
    .from('taxes')
    .select('country, state, rate, label')
    .eq('country', iso)

  if (error || !data) return 0

  const taxes = data as TaxRow[]
  return getTaxRate(taxes, iso, state)
}
