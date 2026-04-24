import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

export interface WalletTransaction {
  id: string
  amount: number
  type: string
  description: string | null
  balance_after: number
  created_at: string
}

export interface WalletDetails {
  balance: number
  currency: string
  transactions: WalletTransaction[]
}

export function useWalletDetails() {
  const { session } = useAuth()
  const [data, setData] = useState<WalletDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWallet = useCallback(async () => {
    if (!session) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-wallet-details`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? json.message ?? `Error ${res.status}`)
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar billetera')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    fetchWallet()
  }, [fetchWallet])

  return { balance: data?.balance ?? 0, currency: data?.currency ?? 'MXN', transactions: data?.transactions ?? [], loading, error, refetch: fetchWallet }
}
