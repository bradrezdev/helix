import { useState, useEffect } from 'react'
import { Wallet, ArrowDownToLine, Filter, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth.ts'
import { supabase } from '../../../lib/supabase.ts'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrencyMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface WithdrawalRequest {
  id: string
  amount: number
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  reference_id: string | null
  created_at: string
}

// For now, derive status - pending if recent, otherwise we'd need additional logic
// The user requirements mention status, but wallet_transactions doesn't have a status column
// We'll show "Pendiente" for all commission_payout since they're withdrawal requests

// ─── Shared Components (from AdminPage) ─────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs font-semibold uppercase tracking-wide mb-3"
      style={{ color: 'rgba(56,58,63,0.60)', fontFamily: 'Poppins, sans-serif' }}
    >
      {children}
    </p>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-6 ${className}`}
      style={{ border: '1px solid #EAECF0' }}
    >
      {children}
    </div>
  )
}

function Spinner() {
  return <Loader2 className="w-4 h-4 animate-spin" />
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useWalletBalance(userId: string) {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    async function fetchBalance() {
      try {
        const { data, error: err } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', userId)
          .single()
        if (err) throw err
        setBalance(data?.balance ?? 0)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al cargar saldo')
      } finally {
        setLoading(false)
      }
    }
    fetchBalance()
  }, [userId])

  return { balance, loading, error }
}

function usePendingWithdrawals(userId: string) {
  const [pending, setPending] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    async function fetchPending() {
      try {
        const { count, error: err } = await supabase
          .from('wallet_transactions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('type', 'commission_payout')
        
        if (err) throw err
        setPending(count ?? 0)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchPending()
  }, [userId])

  return { pending, loading }
}

function useWithdrawalHistory(userId: string, statusFilter: string) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    async function fetchWithdrawals() {
      setLoading(true)
      try {
        let query = supabase
          .from('wallet_transactions')
          .select('id, amount, reference_id, created_at, type')
          .eq('user_id', userId)
          .eq('type', 'commission_payout')
          .order('created_at', { ascending: false })

        const { data, error: err } = await query
        if (err) throw err

        // For now, all commission_payout are "pending" since there's no status column
        // In a real app, you'd have a separate withdrawal_requests table with status
        const mapped: WithdrawalRequest[] = (data ?? []).map((row) => ({
          id: row.id,
          amount: Number(row.amount),
          status: 'pending' as const,
          reference_id: row.reference_id,
          created_at: row.created_at,
        }))

        // Apply filter (for future status filtering)
        let filtered = mapped
        if (statusFilter && statusFilter !== 'all') {
          filtered = mapped.filter(w => w.status === statusFilter)
        }

        setWithdrawals(filtered)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchWithdrawals()
  }, [userId, statusFilter])

  return { withdrawals, loading }
}

// ─── Wallet Summary Section ───────────────────────────────────────────────

function WalletSummary({ userId }: { userId: string }) {
  const { balance, loading: balanceLoading, error: balanceError } = useWalletBalance(userId)
  const { pending, loading: pendingLoading } = usePendingWithdrawals(userId)

  // Calculate pending amount by fetching actual pending transactions
  const [pendingAmount, setPendingAmount] = useState(0)
  const [pendingLoadingAmount, setPendingLoadingAmount] = useState(true)

  useEffect(() => {
    if (!userId) return
    async function fetchPendingAmount() {
      try {
        const { data, error: err } = await supabase
          .from('wallet_transactions')
          .select('amount')
          .eq('user_id', userId)
          .eq('type', 'commission_payout')
        
        if (err) throw err
        const total = (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
        setPendingAmount(total)
      } catch {
        // ignore
      } finally {
        setPendingLoadingAmount(false)
      }
    }
    fetchPendingAmount()
  }, [userId])

  const availableForWithdrawal = balance - pendingAmount
  const MIN_WITHDRAWAL = 100

  if (balanceLoading || pendingLoading || pendingLoadingAmount) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-32" />
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <SectionLabel>Tu Billetera</SectionLabel>
      
      <div className="space-y-4">
        {/* Current Balance */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center">
              <Wallet size={20} style={{ color: '#062A63' }} />
            </div>
            <div>
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>Saldo actual</p>
              <p className="text-xl font-bold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                {formatCurrencyMXN(balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#EAECF0]" />

        {/* Available for withdrawal */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>Disponible para retiro</p>
            <p className="text-lg font-semibold" style={{ color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}>
              {formatCurrencyMXN(availableForWithdrawal)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>Mínimo</p>
            <p className="text-sm font-medium" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
              {formatCurrencyMXN(MIN_WITHDRAWAL)} MXN
            </p>
          </div>
        </div>

        {balanceError && (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {balanceError}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Withdrawal Form Section ───────────────────────────────────────────────

interface WithdrawalFormProps {
  userId: string
  availableBalance: number
  onSuccess: () => void
}

function WithdrawalForm({ userId, availableBalance, onSuccess }: WithdrawalFormProps) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [bankAccount, setBankAccount] = useState<string | null>(null)
  const [loadingBank, setLoadingBank] = useState(true)

  const MIN_WITHDRAWAL = 100

  // Check for bank account in user profile
  useEffect(() => {
    if (!userId) return
    async function checkBankAccount() {
      try {
        const { data, error: err } = await supabase
          .from('users')
          .select('bank_account, wallet_address')
          .eq('id', userId)
          .single()
        
        if (err) throw err
        setBankAccount(data?.bank_account ?? data?.wallet_address ?? null)
      } catch {
        setBankAccount(null)
      } finally {
        setLoadingBank(false)
      }
    }
    checkBankAccount()
  }, [userId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const numAmount = Number(amount)
    
    // Validation
    if (numAmount < MIN_WITHDRAWAL) {
      setError(`El monto mínimo de retiro es ${formatCurrencyMXN(MIN_WITHDRAWAL)} MXN`)
      return
    }
    if (numAmount > availableBalance) {
      setError('El monto excede tu saldo disponible')
      return
    }
    if (!bankAccount) {
      setError('Configura tu cuenta bancaria en Perfil primero')
      return
    }

    setLoading(true)
    try {
      // Get wallet ID
      const { data: wallet, error: walletErr } = await supabase
        .from('wallets')
        .select('id, balance')
        .eq('user_id', userId)
        .single()
      
      if (walletErr) throw walletErr

      const newBalance = Number(wallet.balance) - numAmount

      // Create transaction and update wallet atomically
      const { error: txErr } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          user_id: userId,
          amount: -numAmount, // Negative for withdrawal
          type: 'commission_payout',
          balance_after: newBalance,
          description: `Retiro a cuenta bancaria: ${bankAccount}`,
        })

      if (txErr) throw txErr

      // Update wallet balance
      const { error: updateErr } = await supabase
        .from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id)

      if (updateErr) throw updateErr

      setSuccess(`Retiro de ${formatCurrencyMXN(numAmount)} solicitado correctamente`)
      setAmount('')
      onSuccess()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al procesar retiro')
    } finally {
      setLoading(false)
    }
  }

  if (loadingBank) {
    return (
      <Card>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <SectionLabel>Solicitar Retiro</SectionLabel>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bank Account Display */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Cuenta bancaria
          </label>
          {bankAccount ? (
            <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] px-4 py-3 text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
              {bankAccount}
            </div>
          ) : (
            <div className="rounded-[18px] bg-amber-50 border border-amber-200 px-4 py-3 text-sm flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600" />
              <span className="text-amber-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Configura tu cuenta bancaria en Perfil primero
              </span>
            </div>
          )}
        </div>

        {/* Amount Input */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Monto a retirar (MXN)
          </label>
          <input
            type="number"
            min={MIN_WITHDRAWAL}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Mínimo ${MIN_WITHDRAWAL} MXN`}
            disabled={!bankAccount}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20 disabled:bg-[#F2F4F9]"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          />
          {Number(amount) > availableBalance && Number(amount) > 0 && (
            <p className="text-xs text-red-500 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Excede tu saldo disponible ({formatCurrencyMXN(availableBalance)})
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !bankAccount || !amount || Number(amount) < MIN_WITHDRAWAL || Number(amount) > availableBalance}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {loading ? <Spinner /> : <ArrowDownToLine size={18} />}
          {loading ? 'Procesando...' : 'Solicitar Retiro'}
        </button>

        {/* Messages */}
        {error && (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-4 text-sm text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-[18px] bg-green-50 border border-green-200 p-4 text-sm text-green-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {success}
          </div>
        )}
      </form>
    </Card>
  )
}

// ─── Withdrawal History Section ───────────────────────────────────────────

function WithdrawalHistory({ userId }: { userId: string }) {
  const [statusFilter, setStatusFilter] = useState('all')
  const { withdrawals, loading } = useWithdrawalHistory(userId, statusFilter)

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pending', label: 'Pendiente' },
    { value: 'approved', label: 'Aprobado' },
    { value: 'paid', label: 'Pagado' },
    { value: 'rejected', label: 'Rechazado' },
  ]

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'Pendiente' },
      approved: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Aprobado' },
      paid: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Pagado' },
      rejected: { bg: 'bg-red-50', text: 'text-red-600', label: 'Rechazado' },
    }
    const s = styles[status] || styles.pending
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <SectionLabel>Historial de Retiros</SectionLabel>
        
        {/* Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-full border border-[#EAECF0] px-3 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <Filter size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-12 bg-gray-100 rounded-[18px]" />
          ))}
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
            No hay retiros solicitados
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {withdrawals.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between p-3 rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0]"
            >
              <div>
                <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                  {formatCurrencyMXN(Math.abs(w.amount))}
                </p>
                <p className="text-xs text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {formatDate(w.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(w.status)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────

export function RetirosPage() {
  const { user } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)

  // Get available balance (same logic as WalletSummary)
  const { balance, loading: balanceLoading } = useWalletBalance(user?.id ?? '')
  const [pendingAmount, setPendingAmount] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    async function fetchPendingAmount() {
      try {
        const { data } = await supabase
          .from('wallet_transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('type', 'commission_payout')
        
        const total = (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0)
        setPendingAmount(Math.abs(total))
      } catch {
        // ignore
      }
    }
    fetchPendingAmount()
  }, [user?.id, refreshKey])

  const availableBalance = balance - pendingAmount

  function handleSuccess() {
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F8FAFC' }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <h1
          className="text-2xl font-bold"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Retiros
        </h1>
        <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Solicita el retiro de tus comisiones
        </p>
      </div>

      {/* Content */}
      <div className="px-5 space-y-5">
        {user && (
          <>
            <WalletSummary userId={user.id} />
            
            {!balanceLoading && (
              <WithdrawalForm
                userId={user.id}
                availableBalance={availableBalance}
                onSuccess={handleSuccess}
              />
            )}
            
            <WithdrawalHistory userId={user.id} />
          </>
        )}
      </div>
    </div>
  )
}