import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface WalletTransaction {
  id: string
  wallet_id: string | null
  user_id: string
  amount: number
  type: string
  reference_id: string | null
  description: string | null
  balance_after: number
  created_at: string
}

export function useWalletTransactions(userId: string | null): {
  transactions: WalletTransaction[]
  loading: boolean
  refetch: () => void
} {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    if (!userId) {
      setTransactions([])
      return
    }
    setLoading(true)
    try {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('id, wallet_id, user_id, amount, type, reference_id, description, balance_after, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      setTransactions((data as WalletTransaction[]) ?? [])
    } finally {
      setLoading(false)
    }
  }, [userId])

  return { transactions, loading, refetch }
}
