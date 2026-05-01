import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getTaxRate, getTaxLabel, normalizeCountry } from '../utils/tax'
import type { TaxRow } from '../utils/tax'

export interface UseTaxRateResult {
  rate: number
  label: string
  loading: boolean
}

/**
 * Fetches tax rate and label for the given country (ISO 2-letter or currency code).
 * Falls back to rate=0, label='Tax' if not found.
 */
export function useTaxRate(country: string, state?: string): UseTaxRateResult {
  const iso = normalizeCountry(country)

  const { data, isLoading } = useQuery({
    queryKey: ['taxes', iso],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('taxes')
        .select('country, state, rate, label')
        .eq('country', iso)

      if (error) throw error
      return (data ?? []) as TaxRow[]
    },
    enabled: !!country,
    staleTime: 1000 * 60 * 60, // 1 hour — tax rates don't change often
  })

  const taxes = data ?? []
  const rate = getTaxRate(taxes, iso, state)
  const label = getTaxLabel(taxes, iso, state)

  return { rate, label, loading: isLoading }
}
