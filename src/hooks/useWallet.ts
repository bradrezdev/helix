import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface Wallet {
  id: string
  user_id: string
  balance: number
  currency: string
  wallet_type: 'disponible' | 'acumulado'
  updated_at: string
}

export interface WalletsByType {
  disponible: Wallet[]
  acumulado: Wallet[]
}

export function useWallet(userId: string | null): {
  wallets: Wallet[]
  walletsByType: WalletsByType
  loading: boolean
  refetch: () => void
} {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!userId) {
      setWallets([])
      return
    }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('wallets')
        .select('id, user_id, balance, currency, wallet_type, updated_at')
        .eq('user_id', userId)
        .order('currency')
      setWallets((data as Wallet[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    refetch()
  }, [refetch])

  const walletsByType: WalletsByType = {
    disponible: wallets.filter((w) => w.wallet_type === 'disponible'),
    acumulado: wallets.filter((w) => w.wallet_type === 'acumulado'),
  }

  return { wallets, walletsByType, loading, refetch }
}
