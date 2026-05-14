import { useState, useEffect, useCallback } from 'react'
import { User, GitBranch, Users } from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth.ts'
import { supabase } from '../../lib/supabase'
import { useAdminSettings, useUpdateAdminSetting } from './hooks/useAdminSettings.ts'
import type { WalletTransaction } from '../finances/billetera/hooks/useWalletTransactions.ts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrencyMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('es-MX').format(n)
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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
  return (
    <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
  )
}

interface MonthYearPickerProps {
  month: number
  year: number
  onMonthChange: (m: number) => void
  onYearChange: (y: number) => void
}

function MonthYearPicker({ month, year, onMonthChange, onYearChange }: MonthYearPickerProps) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]
  return (
    <div className="flex gap-3">
      <select
        value={month}
        onChange={(e) => onMonthChange(Number(e.target.value))}
        className="flex-1 rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
        style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
      >
        {months.map((label, i) => (
          <option key={i + 1} value={i + 1}>{label}</option>
        ))}
      </select>
      <input
        type="number"
        value={year}
        min={2020}
        max={2100}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className="w-28 rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
        style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
      />
    </div>
  )
}

interface DryRunToggleProps {
  value: boolean
  onChange: (v: boolean) => void
}

function DryRunToggle({ value, onChange }: DryRunToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? 'bg-[#0CBCE5]' : 'bg-[#EAECF0]'}`}
        onClick={() => onChange(!value)}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </div>
      <span className="text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
        Simular sin aplicar
      </span>
    </label>
  )
}

// ─── Section A — Cierre de Mes ────────────────────────────────────────────────

function CierreDeMessSection() {
  const { session } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [dryRun, setDryRun] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ processed_at: string; month: number; year: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleExecute() {
    if (!session) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/monthly-closure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ month, year, dry_run: dryRun }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : json.error ? JSON.stringify(json.error) : (json.message ?? `Error ${res.status}`))
      setResult(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <SectionLabel>Cierre de Mes</SectionLabel>
      <div className="space-y-4">
        <MonthYearPicker month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
        <DryRunToggle value={dryRun} onChange={setDryRun} />
        <button
          onClick={handleExecute}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {loading && <Spinner />}
          Ejecutar Cierre
        </button>

        {result && (
          <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] p-4 text-sm space-y-1">
            <p className="font-semibold text-[#062A63]">Cierre completado</p>
            <p style={{ color: '#383A3F' }}>Período: {result.month}/{result.year}</p>
            <p style={{ color: '#383A3F' }}>Procesado: {new Date(result.processed_at).toLocaleString('es-MX')}</p>
            {dryRun && <p className="text-[#0CBCE5] font-medium">Modo simulación — no se aplicaron cambios</p>}
          </div>
        )}
        {error && (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Section B — Pagar Comisiones ─────────────────────────────────────────────

interface PayoutResult {
  users_paid: number
  total_amount: number
  transactions_created: number
}

function PagarComisionesSection() {
  const { session } = useAuth()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [dryRun, setDryRun] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PayoutResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleProcesar() {
    if (!session) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payout-commissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ month, year, dry_run: dryRun }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : json.error ? JSON.stringify(json.error) : (json.message ?? `Error ${res.status}`))
      setResult(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <SectionLabel>Pagar Comisiones</SectionLabel>
      <div className="space-y-4">
        <MonthYearPicker month={month} year={year} onMonthChange={setMonth} onYearChange={setYear} />
        <DryRunToggle value={dryRun} onChange={setDryRun} />
        <button
          onClick={handleProcesar}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ background: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}
        >
          {loading && <Spinner />}
          Procesar Pagos
        </button>

        {result && (
          <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] p-4 text-sm space-y-1">
            <p className="font-semibold text-[#062A63]">Pagos procesados</p>
            <p style={{ color: '#383A3F' }}>Usuarios pagados: {formatNumber(result.users_paid)}</p>
            <p style={{ color: '#383A3F' }}>Total pagado: {formatCurrencyMXN(result.total_amount)}</p>
            <p style={{ color: '#383A3F' }}>Transacciones creadas: {formatNumber(result.transactions_created)}</p>
            {dryRun && <p className="text-[#0CBCE5] font-medium">Modo simulación — no se aplicaron cambios</p>}
          </div>
        )}
        {error && (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Section C — Abonar Billetera ─────────────────────────────────────────────

interface UserSearchResult {
  id: string
  user_id: number
  name: string
  apellidos: string | null
  email: string
}

interface DepositResult {
  new_balance: number
  transaction_id: string
}

interface UserWallet {
  id: string
  balance: number
  currency: string
}

// TODO: replace with dynamic rates from exchange_rates table
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  MXN: { USD: 0.050, COP: 207.5, EUR: 0.046, MXN: 1 },
  USD: { MXN: 20.0,  COP: 4150,  EUR: 0.92,  USD: 1 },
  COP: { MXN: 0.0048, USD: 0.00024, EUR: 0.00022, COP: 1 },
  EUR: { MXN: 21.7,  USD: 1.087, COP: 4510,  EUR: 1 },
}

function convertAmount(amount: number, from: string, to: string): number {
  if (from === to) return amount
  return amount * (EXCHANGE_RATES[from]?.[to] ?? 1)
}

const DEPOSIT_TYPE_MAP = {
  'Crédito manual': 'manual_credit',
  'Bono': 'bonus',
  'Reembolso': 'refund',
} as const

type DepositTypeLabel = keyof typeof DEPOSIT_TYPE_MAP

function AbonarBilleteraSection() {
  const { session } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [userWallets, setUserWallets] = useState<UserWallet[]>([])
  const [selectedWalletId, setSelectedWalletId] = useState<string>('')
  const [amount, setAmount] = useState<number>(0)
  const [sendCurrency, setSendCurrency] = useState<string>('MXN')
  const [typeLabel, setTypeLabel] = useState<DepositTypeLabel>('Crédito manual')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [walletsLoading, setWalletsLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<DepositResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<WalletTransaction[]>([])
  const [txLoading, setTxLoading] = useState(false)

  const fetchUserWallets = useCallback(async (userId: string) => {
    setWalletsLoading(true)
    try {
      const { data } = await supabase
        .from('wallets')
        .select('id, balance, currency')
        .eq('user_id', userId)
        .order('currency')
      const wallets = (data as UserWallet[]) ?? []
      setUserWallets(wallets)
      if (wallets.length > 0) setSelectedWalletId(wallets[0].id)
      else setSelectedWalletId('')
    } finally {
      setWalletsLoading(false)
    }
  }, [])

  const fetchTransactions = useCallback(async (userId: string) => {
    setTxLoading(true)
    try {
      const { data } = await supabase
        .from('wallet_transactions')
        .select('id, wallet_id, user_id, amount, type, reference_id, description, balance_after, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
      setTransactions((data as WalletTransaction[]) ?? [])
    } finally {
      setTxLoading(false)
    }
  }, [])

  async function handleSearch(query: string) {
    setSearchQuery(query)
    setSelectedUser(null)
    setUserWallets([])
    setTransactions([])
    if (query.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const isNumeric = /^\d+$/.test(query)
      let queryBuilder = supabase
        .from('users')
        .select('id, user_id, name, apellidos, email')
        .limit(5)

      if (isNumeric) {
        queryBuilder = queryBuilder.eq('user_id', Number(query))
      } else {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,email.ilike.%${query}%,apellidos.ilike.%${query}%`)
      }
      const { data } = await queryBuilder
      setSearchResults((data as UserSearchResult[]) ?? [])
    } finally {
      setSearching(false)
    }
  }

  async function handleSelectUser(u: UserSearchResult) {
    setSelectedUser(u)
    setSearchResults([])
    setSearchQuery(`${u.name} ${u.apellidos ?? ''} (#${u.user_id})`.trim())
    await Promise.all([fetchUserWallets(u.id), fetchTransactions(u.id)])
  }

  async function handleAbonar() {
    if (!session || !selectedUser || amount < 1) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const destCurrency = selectedWallet?.currency ?? sendCurrency
      const convertedAmount = convertAmount(amount, sendCurrency, destCurrency)
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          wallet_id: selectedWalletId || undefined,
          amount: convertedAmount,
          type: DEPOSIT_TYPE_MAP[typeLabel],
          description: description || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : json.error ? JSON.stringify(json.error) : (json.message ?? `Error ${res.status}`))
      setResult(json)
      // Refresh wallets and transactions
      await Promise.all([fetchUserWallets(selectedUser.id), fetchTransactions(selectedUser.id)])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const initials = selectedUser
    ? (selectedUser.name?.[0] ?? '') + (selectedUser.apellidos?.[0] ?? '')
    : ''

  const selectedWallet = userWallets.find((w) => w.id === selectedWalletId) ?? null

  return (
    <Card>
      <SectionLabel>Abonar Billetera</SectionLabel>
      <div className="space-y-4">
        {/* User search */}
        <div className="relative">
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Usuario
          </label>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o ID..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={!!selectedUser}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20 disabled:bg-[#F2F4F9]"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          />
          {selectedUser && (
            <button
              onClick={() => { setSelectedUser(null); setSearchQuery(''); setUserWallets([]); setTransactions([]) }}
              className="absolute right-3 top-9 text-xs text-gray-400 hover:text-gray-600"
            >
              X
            </button>
          )}
          {/* Dropdown */}
          {searchResults.length > 0 && (
            <div
              className="absolute z-10 top-full left-0 right-0 mt-1 rounded-[18px] overflow-hidden shadow-lg"
              style={{ background: '#fff', border: '1px solid #EAECF0' }}
            >
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#F2F4F9] transition-colors text-left"
                  onClick={() => handleSelectUser(u)}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: '#062A63' }}
                  >
                    {((u.name?.[0] ?? '') + (u.apellidos?.[0] ?? '')).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                      {u.name} {u.apellidos}
                    </p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      #{u.user_id} · {u.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searching && (
            <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Buscando...</p>
          )}
          {/* Selected user badge */}
          {selectedUser && (
            <div className="flex items-center gap-2 mt-2 p-2 rounded-[14px] bg-[#F2F4F9]">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: '#062A63' }}
              >
                {initials.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                  {selectedUser.name} {selectedUser.apellidos}
                </p>
                <p className="text-xs text-gray-400">#{selectedUser.user_id} · {selectedUser.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Wallet selector */}
        {selectedUser && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Billetera
            </label>
            {walletsLoading ? (
              <div className="h-10 rounded-[18px] bg-[#F2F4F9] animate-pulse" />
            ) : userWallets.length === 0 ? (
              <div className="rounded-[18px] bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Usuario sin billetera — se creará una nueva al abonar
              </div>
            ) : (
              <select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
                style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
              >
                {userWallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.currency} — Saldo: {Number(w.balance).toFixed(2)} {w.currency}
                  </option>
                ))}
              </select>
            )}
            {selectedWallet && (
              <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Divisa de la billetera: <span className="font-semibold">{selectedWallet.currency}</span>
              </p>
            )}
          </div>
        )}

        {/* Amount + send currency */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Monto a enviar
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="0.00"
              className="flex-1 rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
              style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
            />
            <select
              value={sendCurrency}
              onChange={(e) => setSendCurrency(e.target.value)}
              className="w-24 rounded-[18px] border border-[#EAECF0] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
              style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
            >
              {['MXN', 'USD', 'COP', 'EUR'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {/* Conversion preview */}
          {selectedWallet && amount > 0 && (
            <p className="text-xs mt-1.5 font-medium" style={{ color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}>
              {sendCurrency === selectedWallet.currency
                ? `Enviando ${amount.toFixed(2)} ${sendCurrency} a la wallet ${selectedWallet.currency}`
                : `Enviando ${amount.toFixed(2)} ${sendCurrency} = ${convertAmount(amount, sendCurrency, selectedWallet.currency).toFixed(2)} ${selectedWallet.currency} a la wallet ${selectedWallet.currency} del usuario`}
            </p>
          )}
        </div>

        {/* Type */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Tipo de abono
          </label>
          <select
            value={typeLabel}
            onChange={(e) => setTypeLabel(e.target.value as DepositTypeLabel)}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          >
            {Object.keys(DEPOSIT_TYPE_MAP).map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Descripción (opcional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Motivo del abono..."
            rows={2}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20 resize-none"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          />
        </div>

        <button
          onClick={handleAbonar}
          disabled={loading || !selectedUser || amount < 1}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {loading && <Spinner />}
          Abonar
        </button>

        {result && (
          <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] p-4 text-sm space-y-1">
            <p className="font-semibold text-[#062A63]">Abono realizado</p>
            <p style={{ color: '#383A3F' }}>Nuevo saldo: {formatCurrencyMXN(result.new_balance)}</p>
            <p style={{ color: '#383A3F' }}>ID transacción: {result.transaction_id}</p>
          </div>
        )}
        {error && (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* B2 — Transaction history */}
        {selectedUser && (
          <div className="pt-2 border-t border-[#EAECF0]">
            <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(56,58,63,0.60)', fontFamily: 'Poppins, sans-serif' }}>
              Historial de movimientos
            </p>
            {txLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 rounded-[14px] bg-[#F2F4F9] animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-xs text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>Sin movimientos</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F2F4F9]">
                      {['Fecha', 'Tipo', 'Monto', 'Descripción', 'Saldo después'].map((h) => (
                        <th key={h} className="text-left py-2 px-2 font-semibold" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-[#F2F4F9]">
                        <td className="py-2 px-2 whitespace-nowrap text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className="py-2 px-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#F2F4F9]" style={{ color: '#062A63' }}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-2 px-2 font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.amount >= 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-gray-400 max-w-[120px] truncate">{tx.description ?? '—'}</td>
                        <td className="py-2 px-2 text-gray-500">{Number(tx.balance_after).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Section D — Estadísticas ─────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number
  ordersThisMonth: number
  pendingCommissions: number
  totalWalletBalance: number
  totalPaidOrders: number
  totalSalesRevenue: number
  totalCommissionPaid: number
}

function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchStats() {
      try {
        const now = new Date()
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const [
          usersRes,
          ordersRes,
          commissionsRes,
          walletsRes,
          paidOrdersRes,
          salesRes,
          commissionPaidRes,
        ] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', firstOfMonth),
          supabase.from('commissions').select('id', { count: 'exact', head: true }).is('paid_at', null).not('calculated_at', 'is', null),
          supabase.from('wallets').select('balance'),
          supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
          supabase.from('orders').select('total_amount').eq('status', 'paid'),
          supabase.from('commissions').select('amount').not('paid_at', 'is', null),
        ])

        if (cancelled) return

        // Handle potential errors
        if (walletsRes.error) {
          console.error('Error fetching wallets:', walletsRes.error)
        }

        const totalBalance = (walletsRes.data ?? []).reduce(
          (sum: number, w: { balance: number }) => sum + (w.balance ?? 0),
          0
        )

        const totalRevenue = ((salesRes.data ?? []) as { total_amount: number }[]).reduce(
          (sum: number, o) => sum + (Number(o.total_amount) || 0),
          0
        )

        const totalCommissionsPaid = ((commissionPaidRes.data ?? []) as { amount: number }[]).reduce(
          (sum: number, c) => sum + (Number(c.amount) || 0),
          0
        )

        setStats({
          totalUsers: usersRes.count ?? 0,
          ordersThisMonth: ordersRes.count ?? 0,
          pendingCommissions: commissionsRes.count ?? 0,
          totalWalletBalance: totalBalance,
          totalPaidOrders: paidOrdersRes.count ?? 0,
          totalSalesRevenue: totalRevenue,
          totalCommissionPaid: totalCommissionsPaid,
        })
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar estadísticas')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchStats()
    return () => { cancelled = true }
  })

  return { stats, loading, error }
}

function EstadisticasSection() {
  const { stats, loading, error } = useAdminStats()

  const statItems = stats
    ? [
        { label: 'Usuarios registrados', value: formatNumber(stats.totalUsers) },
        { label: 'Órdenes este mes', value: formatNumber(stats.ordersThisMonth) },
        { label: 'Órdenes pagadas (total)', value: formatNumber(stats.totalPaidOrders) },
        { label: 'Ventas totales', value: formatCurrencyMXN(stats.totalSalesRevenue) },
        { label: 'Comisiones pagadas', value: formatCurrencyMXN(stats.totalCommissionPaid) },
        { label: 'Comisiones pendientes', value: formatNumber(stats.pendingCommissions) },
        { label: 'Total en billeteras', value: formatCurrencyMXN(stats.totalWalletBalance) },
      ]
    : []

  return (
    <Card>
      <SectionLabel>Estadísticas</SectionLabel>
      {error && (
        <div className="rounded-[18px] bg-red-50 border border-red-200 p-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="rounded-[18px] bg-[#F2F4F9] h-16 animate-pulse" />
            ))
          : statItems.map((item) => (
              <div
                key={item.label}
                className="rounded-[18px] bg-[#F2F4F9] p-3 text-center"
              >
                <p className="text-xs text-gray-500 mb-1 leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {item.label}
                </p>
                <p className="text-base font-bold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                  {item.value}
                </p>
              </div>
            ))}
      </div>
    </Card>
  )
}

// ─── Section E — Asignar Orden ────────────────────────────────────────────────

type AssignMode = 'single' | 'network' | 'all'

interface AssignOrderResult {
  users_count: number
  total_pv: number
  total_amount: number
  orders_created?: number
  dry_run?: boolean
}

function AsignarOrdenSection() {
  const { session } = useAuth()
  const [mode, setMode] = useState<AssignMode>('single')
  const [quantity, setQuantity] = useState(5)
  const [dryRun, setDryRun] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AssignOrderResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // User search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [searching, setSearching] = useState(false)

  async function handleSearch(query: string) {
    setSearchQuery(query)
    setSelectedUser(null)
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const isNumeric = /^\d+$/.test(query)
      let q = supabase.from('users').select('id, user_id, name, apellidos, email').limit(5)
      if (isNumeric) { q = q.eq('user_id', Number(query)) }
      else { q = q.or(`name.ilike.%${query}%,email.ilike.%${query}%,apellidos.ilike.%${query}%`) }
      const { data } = await q
      setSearchResults((data as UserSearchResult[]) ?? [])
    } finally { setSearching(false) }
  }

  function handleSelectUser(u: UserSearchResult) {
    setSelectedUser(u)
    setSearchResults([])
    setSearchQuery(`${u.name} ${u.apellidos ?? ''} (#${u.user_id})`.trim())
  }

  async function handleAsignar() {
    if (!session) return
    if ((mode === 'single' || mode === 'network') && !selectedUser) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-assign-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          mode,
          user_id: selectedUser?.id,
          quantity,
          dry_run: dryRun,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : json.error ? JSON.stringify(json.error) : (json.message ?? `Error ${res.status}`))
      setResult(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const modeOptions: { id: AssignMode; label: string; sub: string; icon: React.ReactNode }[] = [
    { id: 'single', label: 'Usuario específico', sub: 'Asigna a un usuario', icon: <User size={18} /> },
    { id: 'network', label: 'Usuario + Red', sub: 'Incluye descendientes', icon: <GitBranch size={18} /> },
    { id: 'all', label: 'Todos los usuarios', sub: 'Asigna a toda la red', icon: <Users size={18} /> },
  ]

  const needsUser = mode === 'single' || mode === 'network'
  const canSubmit = !loading && (!needsUser || !!selectedUser)

  return (
    <Card>
      <SectionLabel>Asignar Orden GSHMAX</SectionLabel>
      <div className="space-y-5">
        {/* Quantity */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Cantidad por usuario
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(100, Number(e.target.value))))}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          />
        </div>

        {/* Mode selector */}
        <div>
          <label className="text-xs text-gray-500 mb-2 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Modo de asignación
          </label>
          <div className="grid grid-cols-1 gap-2">
            {modeOptions.map((opt) => {
              const active = mode === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => { setMode(opt.id); setSelectedUser(null); setSearchQuery(''); setSearchResults([]) }}
                  className="flex items-center gap-3 px-4 py-3 rounded-[32px] border text-left transition-all"
                  style={{
                    borderColor: active ? '#062A63' : '#EAECF0',
                    background: active ? '#EFF6FF' : '#fff',
                    color: active ? '#062A63' : '#383A3F',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  <span style={{ color: active ? '#062A63' : '#9CA3AF' }}>{opt.icon}</span>
                  <div>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs" style={{ color: '#9CA3AF' }}>{opt.sub}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* User search — shown when single or network */}
        {needsUser && (
          <div className="relative">
            <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Usuario
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre, correo o ID..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={!!selectedUser}
              className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20 disabled:bg-[#F2F4F9]"
              style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
            />
            {selectedUser && (
              <button
                onClick={() => { setSelectedUser(null); setSearchQuery('') }}
                className="absolute right-3 top-9 text-xs text-gray-400 hover:text-gray-600"
              >
                X
              </button>
            )}
            {searchResults.length > 0 && (
              <div
                className="absolute z-10 top-full left-0 right-0 mt-1 rounded-[18px] overflow-hidden shadow-lg"
                style={{ background: '#fff', border: '1px solid #EAECF0' }}
              >
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#F2F4F9] transition-colors text-left"
                    onClick={() => handleSelectUser(u)}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: '#062A63' }}
                    >
                      {((u.name?.[0] ?? '') + (u.apellidos?.[0] ?? '')).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                        {u.name} {u.apellidos}
                      </p>
                      <p className="text-xs text-gray-400">#{u.user_id} · {u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Buscando...</p>
            )}
            {selectedUser && (
              <div className="flex items-center gap-2 mt-2 p-2 rounded-[14px] bg-[#F2F4F9]">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: '#062A63' }}
                >
                  {((selectedUser.name?.[0] ?? '') + (selectedUser.apellidos?.[0] ?? '')).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                    {selectedUser.name} {selectedUser.apellidos}
                  </p>
                  <p className="text-xs text-gray-400">#{selectedUser.user_id} · {selectedUser.email}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dry run toggle */}
        <DryRunToggle value={dryRun} onChange={setDryRun} />

        {/* Preview from dry run result */}
        {result && dryRun && (
          <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] p-4 text-sm space-y-1">
            <p className="font-semibold text-[#062A63]" style={{ fontFamily: 'Poppins, sans-serif' }}>Vista previa</p>
            <p style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>{result.users_count} usuarios recibirán esta orden</p>
            <p style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
              Total PV generado: <span style={{ color: '#0CBCE5', fontWeight: 600 }}>{result.total_pv} PV</span>
            </p>
            <p style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
              Total facturado: <span style={{ fontWeight: 600 }}>{formatCurrencyMXN(result.total_amount)}</span>
            </p>
          </div>
        )}

        <button
          onClick={handleAsignar}
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {loading && <Spinner />}
          {dryRun ? 'Simular asignación' : 'Asignar Orden'}
        </button>

        {result && !dryRun && (
          <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] p-4 text-sm space-y-1">
<p className="font-semibold text-[#062A63]">
              {result.orders_created ?? result.users_count} ordenes creadas · {result.total_pv} PV total · {formatCurrencyMXN(result.total_amount)}
            </p>
          </div>
        )}
        {error && (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── UserSearchField — reusable user picker ───────────────────────────────────

interface UserSearchFieldProps {
  label: string
  value: UserSearchResult | null
  onSelect: (u: UserSearchResult) => void
  onClear: () => void
}

function UserSearchField({ label, value: selectedUser, onSelect, onClear }: UserSearchFieldProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const isNumeric = /^\d+$/.test(query)
      let q = supabase.from('users').select('id, user_id, name, apellidos, email').limit(5)
      if (isNumeric) { q = q.eq('user_id', Number(query)) }
      else { q = q.or(`name.ilike.%${query}%,email.ilike.%${query}%,apellidos.ilike.%${query}%`) }
      const { data } = await q
      setSearchResults((data as UserSearchResult[]) ?? [])
    } finally { setSearching(false) }
  }

  function handleSelectUser(u: UserSearchResult) {
    onSelect(u)
    setSearchResults([])
    setSearchQuery(`${u.name} ${u.apellidos ?? ''} (#${u.user_id})`.trim())
  }

  function handleClear() {
    onClear()
    setSearchQuery('')
    setSearchResults([])
  }

  return (
    <div className="relative">
      <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
        {label}
      </label>
      <input
        type="text"
        placeholder="Buscar por nombre, correo o ID..."
        value={selectedUser ? `${selectedUser.name} ${selectedUser.apellidos ?? ''} (#${selectedUser.user_id})`.trim() : searchQuery}
        onChange={(e) => { if (!selectedUser) handleSearch(e.target.value) }}
        disabled={!!selectedUser}
        className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20 disabled:bg-[#F2F4F9]"
        style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
      />
      {selectedUser && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-9 text-xs text-gray-400 hover:text-gray-600"
        >
          X
        </button>
      )}
      {searchResults.length > 0 && (
        <div
          className="absolute z-10 top-full left-0 right-0 mt-1 rounded-[18px] overflow-hidden shadow-lg"
          style={{ background: '#fff', border: '1px solid #EAECF0' }}
        >
          {searchResults.map((u) => (
            <button
              key={u.id}
              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#F2F4F9] transition-colors text-left"
              onClick={() => handleSelectUser(u)}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ background: '#062A63' }}
              >
                {((u.name?.[0] ?? '') + (u.apellidos?.[0] ?? '')).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                  {u.name} {u.apellidos}
                </p>
                <p className="text-xs text-gray-400">#{u.user_id} · {u.email}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {searching && (
        <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Buscando...</p>
      )}
      {selectedUser && (
        <div className="flex items-center gap-2 mt-2 p-2 rounded-[14px] bg-[#F2F4F9]">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: '#062A63' }}
          >
            {((selectedUser.name?.[0] ?? '') + (selectedUser.apellidos?.[0] ?? '')).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
              {selectedUser.name} {selectedUser.apellidos}
            </p>
            <p className="text-xs text-gray-400">#{selectedUser.user_id} · {selectedUser.email}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Section F — Ceder Patrocinio ─────────────────────────────────────────────

function CederPatrocinioSection() {
  const [memberUser, setMemberUser] = useState<UserSearchResult | null>(null)
  const [sponsorUser, setSponsorUser] = useState<UserSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = !loading && !!memberUser && !!sponsorUser

  async function handleTransfer() {
    if (!memberUser || !sponsorUser) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { error: rpcError } = await supabase.rpc('transfer_sponsorship', {
        p_member_id: memberUser.id,
        p_new_sponsor_id: sponsorUser.id,
      })
      if (rpcError) throw new Error(rpcError.message)
      setResult(`Patrocinio cedido: ${memberUser.name} ${memberUser.apellidos ?? ''} ahora está bajo ${sponsorUser.name} ${sponsorUser.apellidos ?? ''}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <SectionLabel>Ceder Patrocinio</SectionLabel>
      <div className="space-y-4">
        {/* Warning */}
        <div className="rounded-[18px] bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Esta acción moverá al usuario y todos sus descendientes bajo el nuevo patrocinador
        </div>

        <UserSearchField
          label="Usuario a transferir"
          value={memberUser}
          onSelect={setMemberUser}
          onClear={() => setMemberUser(null)}
        />

        <UserSearchField
          label="Nuevo patrocinador"
          value={sponsorUser}
          onSelect={setSponsorUser}
          onClear={() => setSponsorUser(null)}
        />

        <button
          onClick={handleTransfer}
          disabled={!canSubmit}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {loading && <Spinner />}
          Ceder Patrocinio
        </button>

        {result && (
          <div className="rounded-[18px] bg-green-50 border border-green-200 p-4 text-sm text-green-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {result}
          </div>
        )}
        {error && (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-4 text-sm text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {error}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Section G — Holding Tank Control ────────────────────────────────────────

interface HoldingTankResetConfig {
  pending: boolean
  reset_at?: string
  created_at?: string
  id?: number
}

interface TankMember {
  member_id: string
  member_name: string
  member_email: string
  member_user_id: number
  sponsor_id: string
  sponsor_name: string
  sponsor_user_id: number
  entered_at: string
}

function PlaceMemberCard({
  member,
  onPlaced,
}: {
  member: TankMember
  onPlaced: () => void
}) {
  const [parentSearch, setParentSearch] = useState('')
  const [parentResults, setParentResults] = useState<UserSearchResult[]>([])
  const [parentUser, setParentUser] = useState<UserSearchResult | null>(null)
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function searchParent(q: string) {
    setParentSearch(q)
    if (q.trim().length < 2) { setParentResults([]); return }
    const { data } = await supabase
      .from('users')
      .select('id, user_id, name, apellidos, email')
      .or(`name.ilike.%${q}%,email.ilike.%${q}%,user_id.eq.${isNaN(Number(q)) ? -1 : Number(q)}`)
      .limit(5)
    setParentResults((data as UserSearchResult[]) ?? [])
  }

  async function handlePlace() {
    if (!parentUser) return
    setPlacing(true)
    setPlaceError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('place_user_from_tank', {
        p_member_id: member.member_id,
        p_parent_id: parentUser.id,
      })
      if (rpcError) throw new Error(rpcError.message)
      const res = data as { success?: boolean; error?: string }
      if (res?.error) throw new Error(res.error)
      onPlaced()
    } catch (e) {
      setPlaceError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="rounded-[18px] border border-[#EAECF0] bg-white p-4 space-y-3">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div>
          <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
            #{member.member_user_id} {member.member_name}
          </p>
          <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
            {member.member_email}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
            Patrocinador: #{member.sponsor_user_id} {member.sponsor_name}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(12,188,229,0.10)', color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}>
          {expanded ? 'Cerrar' : 'Colocar'}
        </span>
      </div>

      {expanded && (
        <div className="space-y-2 pt-1 border-t border-[#EAECF0]">
          <p className="text-xs font-medium" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
            Colocar bajo:
          </p>
          <input
            type="text"
            placeholder="Buscar por nombre, email o ID..."
            value={parentSearch}
            onChange={e => searchParent(e.target.value)}
            className="w-full rounded-[14px] border border-[#EAECF0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          />
          {parentResults.length > 0 && !parentUser && (
            <div className="rounded-[14px] border border-[#EAECF0] overflow-hidden">
              {parentResults.map(u => (
                <button
                  key={u.id}
                  onClick={() => { setParentUser(u); setParentResults([]); setParentSearch('') }}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#F2F4F9] transition-colors border-b border-[#EAECF0] last:border-0"
                >
                  <span className="text-sm font-medium" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                    #{u.user_id} {u.name}
                  </span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{u.email}</span>
                </button>
              ))}
            </div>
          )}
          {parentUser && (
            <div className="flex items-center justify-between rounded-[14px] bg-[#F2F4F9] px-3 py-2">
              <span className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                #{parentUser.user_id} {parentUser.name}
              </span>
              <button
                onClick={() => setParentUser(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          )}
          {placeError && (
            <p className="text-xs px-2 py-1.5 rounded-[10px] bg-red-50 text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {placeError}
            </p>
          )}
          <button
            onClick={handlePlace}
            disabled={!parentUser || placing}
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-all active:scale-95"
            style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            {placing && <Spinner />}
            Confirmar Colocación
          </button>
        </div>
      )}
    </div>
  )
}

function HoldingTankSection() {
  const [config, setConfig] = useState<HoldingTankResetConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Tank members list
  const [tankMembers, setTankMembers] = useState<TankMember[]>([])
  const [tankLoading, setTankLoading] = useState(true)

  async function loadConfig() {
    setConfigLoading(true)
    try {
      const { data, error: rpcError } = await supabase.rpc('get_holding_tank_reset_config')
      if (rpcError) throw new Error(rpcError.message)
      setConfig(data as HoldingTankResetConfig)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar configuración')
    } finally {
      setConfigLoading(false)
    }
  }

  async function loadTankMembers() {
    setTankLoading(true)
    try {
      const { data, error: dbError } = await supabase
        .from('holding_tank')
        .select(`
          member_id,
          sponsor_id,
          entered_at,
          member:users!holding_tank_member_id_fkey(user_id, name, email),
          sponsor:users!holding_tank_sponsor_id_fkey(user_id, name)
        `)
        .order('entered_at', { ascending: true })
      if (dbError) throw dbError
      const rows = (data ?? []).map((r: any) => ({
        member_id: r.member_id,
        member_name: r.member?.name ?? '—',
        member_email: r.member?.email ?? '—',
        member_user_id: r.member?.user_id ?? 0,
        sponsor_id: r.sponsor_id,
        sponsor_name: r.sponsor?.name ?? '—',
        sponsor_user_id: r.sponsor?.user_id ?? 0,
        entered_at: r.entered_at,
      }))
      setTankMembers(rows)
    } catch (e) {
      // non-blocking — tank list failing shouldn't break the section
      console.error('loadTankMembers:', e)
    } finally {
      setTankLoading(false)
    }
  }

  useEffect(() => { loadConfig(); loadTankMembers() }, [])

  async function handleSchedule() {
    if (!scheduledAt) return
    setScheduleLoading(true)
    setError(null)
    setResult(null)
    try {
      const { error: rpcError } = await supabase.rpc('schedule_holding_tank_reset', {
        p_reset_at: new Date(scheduledAt).toISOString(),
      })
      if (rpcError) throw new Error(rpcError.message)
      setResult('Reinicio programado correctamente')
      setScheduledAt('')
      await loadConfig()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setScheduleLoading(false)
    }
  }

  async function handleCancel() {
    setCancelLoading(true)
    setError(null)
    setResult(null)
    try {
      const { error: rpcError } = await supabase.rpc('cancel_holding_tank_reset')
      if (rpcError) throw new Error(rpcError.message)
      setResult('Reinicio cancelado')
      await loadConfig()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cancelar')
    } finally {
      setCancelLoading(false)
    }
  }

  async function handleResetNow() {
    setShowConfirm(false)
    setResetLoading(true)
    setError(null)
    setResult(null)
    try {
      const { error: rpcError } = await supabase.rpc('reset_holding_tank')
      if (rpcError) throw new Error(rpcError.message)
      setResult('Holding tank reiniciado. Usuarios colocados bajo sus patrocinadores.')
      await loadConfig()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <Card>
      <SectionLabel>Holding Tank — Control</SectionLabel>
      <div className="space-y-4">

        {/* Current config */}
        {configLoading ? (
          <div className="rounded-[18px] bg-[#F2F4F9] h-14 animate-pulse" />
        ) : config?.pending ? (
          <div className="rounded-[18px] bg-blue-50 border border-blue-200 p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-blue-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Reinicio programado para:
              </p>
              <p className="text-sm text-blue-800 font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {config.reset_at ? new Date(config.reset_at).toLocaleString('es-MX') : '—'}
              </p>
            </div>
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold text-red-600 border border-red-200 bg-white hover:bg-red-50 transition-all disabled:opacity-50"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {cancelLoading ? <Spinner /> : 'Cancelar'}
            </button>
          </div>
        ) : (
          <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] p-3 text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Sin reinicio programado
          </div>
        )}

        {/* Schedule new reset */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Programar nuevo reinicio
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          />
        </div>

        <button
          onClick={handleSchedule}
          disabled={scheduleLoading || !scheduledAt}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ background: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}
        >
          {scheduleLoading && <Spinner />}
          Programar Reinicio
        </button>

        {/* Divider */}
        <div className="border-t border-[#EAECF0]" />

        {/* Execute now */}
        {showConfirm ? (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-4 space-y-3">
            <p className="text-sm font-semibold text-red-700" style={{ fontFamily: 'Poppins, sans-serif' }}>¿Estás seguro?</p>
            <p className="text-xs text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Esto colocará a TODOS los usuarios del tanque bajo sus respectivos patrocinadores
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleResetNow}
                disabled={resetLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-all disabled:opacity-60"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {resetLoading && <Spinner />}
                Sí, ejecutar
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold border border-[#EAECF0] bg-white text-gray-600 hover:bg-[#F2F4F9] transition-all"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={resetLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
            style={{ background: '#e53e3e', fontFamily: 'Poppins, sans-serif' }}
          >
            Ejecutar Reinicio Ahora
          </button>
        )}

        {result && (
          <div className="rounded-[18px] bg-green-50 border border-green-200 p-4 text-sm text-green-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {result}
          </div>
        )}
        {error && (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-4 text-sm text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {error}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-[#EAECF0]" />

        {/* Tank members list */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
              Usuarios en Holding Tank
            </p>
            <button
              onClick={loadTankMembers}
              className="text-xs font-medium px-3 py-1 rounded-full border border-[#EAECF0] bg-white hover:bg-[#F2F4F9] transition-colors"
              style={{ color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}
            >
              Actualizar
            </button>
          </div>

          {tankLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-[18px] bg-[#F2F4F9] h-16 animate-pulse" />
              ))}
            </div>
          ) : tankMembers.length === 0 ? (
            <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] p-4 text-center text-sm text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Tank vacío — no hay usuarios pendientes de colocación
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {tankMembers.length} usuario{tankMembers.length !== 1 ? 's' : ''} pendiente{tankMembers.length !== 1 ? 's' : ''}
              </p>
              {tankMembers.map(m => (
                <PlaceMemberCard
                  key={m.member_id}
                  member={m}
                  onPlaced={() => loadTankMembers()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── Tab Nav ──────────────────────────────────────────────────────────────────

type TabId = 'cierre' | 'pagos' | 'billetera' | 'stats' | 'asignar' | 'patrocinio' | 'holding' | 'datos' | 'exportar' | 'orden' | 'cambio' | 'red' | 'config' | 'roles'

const TABS: { id: TabId; label: string }[] = [
  { id: 'cierre', label: 'Cierre Mes' },
  { id: 'pagos', label: 'Comisiones' },
  { id: 'billetera', label: 'Billetera' },
  { id: 'stats', label: 'Estadísticas' },
  { id: 'asignar', label: 'Asignar Orden' },
  { id: 'patrocinio', label: 'Patrocinio' },
  { id: 'holding', label: 'Holding Tank' },
  { id: 'datos', label: 'Datos Usuario' },
  { id: 'config', label: 'Configuración' },
  { id: 'exportar', label: 'Exportar' },
  { id: 'orden', label: 'Editar Orden' },
  { id: 'cambio', label: 'Tipo Cambio' },
  { id: 'red', label: 'Crear Red' },
  { id: 'roles', label: 'Roles' },
]

// ─── NEW TOOLS H–O ──────────────────────────────────────────────────────────

// Tool H — Buscar Usuario (Org Chart from user)
function BuscarUsuarioSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null)
  const [downline, setDownline] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(query: string) {
    setSearchQuery(query)
    setSelectedUser(null)
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const isNumeric = /^\d+$/.test(query)
      let q = supabase.from('users').select('id, user_id, name, email, created_at').limit(5)
      if (isNumeric) q = q.eq('user_id', Number(query))
      else q = q.or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      const { data } = await q
      if (!data) setSearchResults([])
      else setSearchResults(data as any[])
    } finally { setSearching(false) }
  }

  async function handleSelectUser(u: any) {
    setSelectedUser(u)
    setSearchResults([])
    setSearchQuery(`${u.name} (#${u.user_id})`)
    setLoading(true)
    setError(null)
    try {
      const { data } = await supabase.from('users').select('id, user_id, name, email, created_at').eq('sponsor_id', u.user_id)
      if (!data) setDownline([])
      else setDownline(data as any[])
    } catch (e: any) { setError(e.message); setDownline([]) }
    finally { setLoading(false) }
  }

  return (
    <Card>
      <SectionLabel>Buscar Usuario — Org Chart</SectionLabel>
      <div className="space-y-4">
        <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
          disabled={!!selectedUser} className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm"
        />
        {searchResults.length > 0 && !selectedUser && (
          <div className="absolute z-10 top-full mt-1 w-full bg-white border rounded-[18px] shadow-lg">
            {searchResults.map((u: any) => (
              <button key={u.id} onClick={() => handleSelectUser(u)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50">
                {u.name} #{u.user_id}
              </button>
            ))}
          </div>
        )}
        {loading && <div className="text-center py-4"><Spinner /></div>}
        {!loading && downline.length > 0 && (
          <div className="space-y-2">
            {downline.map((d: any) => (
              <div key={d.id} className="rounded-[18px] bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm font-medium">{d.name} #{d.user_id}</p>
                <p className="text-xs text-gray-500">{new Date(d.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
        {!loading && selectedUser && downline.length === 0 && (
          <p className="text-gray-400">Sin downline</p>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </Card>
  )
}

// Tool I — Ver Datos de Usuario
function VerDatosUsuarioSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [subTab, setSubTab] = useState<'ordenes' | 'commisiones' | 'billetera' | 'registros' | 'retiros'>('ordenes')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subTabs = [
    { id: 'ordenes', label: 'Órdenes' },
    { id: 'commisiones', label: 'Comisiones' },
    { id: 'billetera', label: 'Billetera' },
    { id: 'registros', label: 'Registros' },
    { id: 'retiros', label: 'Retiros' },
  ]

  // Fetch data when user is selected and subTab changes
  useEffect(() => {
    if (!selectedUser) return
    fetchTabData(selectedUser.id, selectedUser.user_id, subTab)
  }, [subTab, selectedUser?.id])

  async function fetchTabData(userId: string, userNumId: number, tab: string) {
    setLoading(true)
    setError(null)
    try {
      let query: any = null
      
      switch (tab) {
        case 'ordenes':
          query = supabase.from('orders').select('id, pv, cv, total_amount, status, created_at, order_id').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
          break
        case 'commisiones':
          query = supabase.from('commissions').select('id, amount, bono_type, period_month, period_year, calculated_at, paid_at').eq('user_id', userId).order('calculated_at', { ascending: false }).limit(50)
          break
        case 'billetera':
          query = supabase.from('wallet_transactions').select('id, type, amount, balance_after, created_at, description').eq('user_id', userId).order('created_at', { ascending: false }).limit(50)
          break
        case 'registros':
          query = supabase.from('users').select('id, user_id, name, email, created_at').eq('sponsor_id', userNumId).order('created_at', { ascending: false }).limit(50)
          break
        case 'retiros':
          query = supabase.from('wallet_transactions').select('id, type, amount, balance_after, created_at, description').eq('user_id', userId).eq('type', 'commission_payout').order('created_at', { ascending: false }).limit(50)
          break
        default:
          setData([])
          setLoading(false)
          return
      }
      
      if (!query) return
      
      const { data: res, error: err } = await query
      if (err) throw err
      if (!res) { setData([]); setLoading(false); return }
      setData(res as any[])
    } catch (e: any) {
      setError(e.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (query.length < 2) { setSearchResults([]); return }
    const isNumeric = /^\d+$/.test(query)
    let q = supabase.from('users').select('id, user_id, name, email').limit(5)
    if (isNumeric) q = q.eq('user_id', Number(query))
    else q = q.or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    const { data: res, error: err } = await q
    if (err) {
      setError(err.message)
      setSearchResults([])
      return
    }
    if (!res) setSearchResults([])
    else setSearchResults(res as any[])
  }

  async function handleSelectUser(u: any) {
    setSelectedUser(u)
    setSearchResults([])
    setSearchQuery(`${u.name} (#${u.user_id})`)
    // Reset to default tab and fetch
    setSubTab('ordenes')
  }

  // Column headers based on current tab
  const getColumns = () => {
    switch (subTab) {
      case 'ordenes': return ['Fecha', 'Orden', 'PV', 'CV', 'Monto', 'Status']
      case 'commisiones': return ['Fecha', 'Tipo', 'Monto', 'Periodo', 'Pagado']
      case 'billetera': return ['Fecha', 'Tipo', 'Monto', 'Saldo', 'Descripción']
      case 'registros': return ['Fecha', 'ID', 'Nombre', 'Email']
      case 'retiros': return ['Fecha', 'Monto', 'Saldo', 'Descripción']
      default: return []
    }
  }

  const renderRow = (d: any) => {
    switch (subTab) {
      case 'ordenes':
        return (
          <>
            <td className="py-2 px-2 border-b whitespace-nowrap">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}</td>
            <td className="py-2 px-2 border-b text-xs">#{d.order_id?.slice(-6) || d.id?.slice(-6)}</td>
            <td className="py-2 px-2 border-b">{d.pv || 0}</td>
            <td className="py-2 px-2 border-b">{d.cv || 0}</td>
            <td className="py-2 px-2 border-b font-medium">${Number(d.total_amount || 0).toFixed(2)}</td>
            <td className="py-2 px-2 border-b"><span className={`px-2 py-0.5 rounded-full text-xs ${d.status === 'paid' ? 'bg-green-100 text-green-700' : d.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span></td>
          </>
        )
      case 'commisiones':
        return (
          <>
            <td className="py-2 px-2 border-b whitespace-nowrap">{d.calculated_at ? new Date(d.calculated_at).toLocaleDateString() : '-'}</td>
            <td className="py-2 px-2 border-b">{d.bono_type || '-'}</td>
            <td className="py-2 px-2 border-b font-medium text-green-600">+${Number(d.amount || 0).toFixed(2)}</td>
            <td className="py-2 px-2 border-b">{d.period_month}/{d.period_year}</td>
            <td className="py-2 px-2 border-b">{d.paid_at ? 'SI' : 'NO'}</td>
          </>
        )
      case 'billetera':
      case 'retiros':
        return (
          <>
            <td className="py-2 px-2 border-b whitespace-nowrap">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}</td>
            <td className="py-2 px-2 border-b"><span className={`px-2 py-0.5 rounded-full text-xs ${d.type === 'commission_payout' ? 'bg-green-100 text-green-700' : d.type === 'manual_credit' ? 'bg-blue-100 text-blue-700' : d.type === 'order_payment' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{d.type}</span></td>
            <td className={`py-2 px-2 border-b font-medium ${d.type === 'commission_payout' || d.type === 'manual_credit' || d.type === 'refund' || d.type === 'bonus' ? 'text-green-600' : 'text-red-600'}`}>{d.type === 'order_payment' ? '-' : '+'}${Number(d.amount || 0).toFixed(2)}</td>
            <td className="py-2 px-2 border-b text-gray-500">${Number(d.balance_after || 0).toFixed(2)}</td>
            <td className="py-2 px-2 border-b text-gray-500 text-xs max-w-[150px] truncate">{d.description || '-'}</td>
          </>
        )
      case 'registros':
        return (
          <>
            <td className="py-2 px-2 border-b whitespace-nowrap">{d.created_at ? new Date(d.created_at).toLocaleDateString() : '-'}</td>
            <td className="py-2 px-2 border-b">#{d.user_id}</td>
            <td className="py-2 px-2 border-b font-medium">{d.name}</td>
            <td className="py-2 px-2 border-b text-gray-500 text-xs">{d.email}</td>
          </>
        )
      default: return null
    }
  }

  return (
    <Card>
      <SectionLabel>Ver Datos de Usuario</SectionLabel>
      <div className="space-y-4">
        <input type="text" placeholder="Buscar por nombre, email o ID..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
          disabled={!!selectedUser} className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm"
        />
        {searchResults.length > 0 && !selectedUser && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-[18px] shadow-lg">
            {searchResults.map((u: any) => (
              <button key={u.id} onClick={() => handleSelectUser(u)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50">
                {u.name} #{u.user_id} — {u.email}
              </button>
            ))}
          </div>
        )}
        {selectedUser && (
          <>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {subTabs.map(t => (
                <button key={t.id} onClick={() => { if (subTab !== t.id) fetchTabData(selectedUser.id, t.id); setSubTab(t.id as any) }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold ${subTab === t.id ? 'bg-[#062A63] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">Mostrando datos de: <strong>{selectedUser.name}</strong> #{selectedUser.user_id}</p>
          </>
        )}
        {loading && <div className="text-center py-4"><Spinner /></div>}
        {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}
        {!loading && !error && data.length > 0 && selectedUser && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  {getColumns().map((col) => (
                    <th key={col} className="text-left py-2 px-2 font-medium text-gray-600">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50">{renderRow(d)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && selectedUser && data.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">Sin datos para esta pestaña</p>
        )}
      </div>
    </Card>
  )
}

// Tool J — Exportar CSV
function ExportarCSvSection() {
  const [exportType, setExportType] = useState<'ordenes' | 'commisiones' | 'billetera' | 'usuarios'>('usuarios')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const options = [
    { id: 'ordenes', label: 'Órdenes' },
    { id: 'commisiones', label: 'Comisiones' },
    { id: 'billetera', label: 'Billetera' },
    { id: 'usuarios', label: 'Usuarios (Completo)' },
    { id: 'retiros', label: 'Retiros' },
  ]

  async function handleExport() {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      if (exportType === 'usuarios') {
        // Full user export with all required fields
        const { data, error: err } = await supabase
          .from('users')
          .select(`
            id, user_id, name, apellidos, email, 
            membership, rank, personal_pv, personal_cv, group_vg,
            is_active, kit_type, promotor_bonos, fidelity_points, ltp_points,
            enrollment_date, created_at, sponsor_id, achieved_ranks
          `)
          .order('user_id', { ascending: true })
          .limit(10000)
        
        if (err) throw err
        if (!data) { setError('Sin usuarios'); setLoading(false); return }
        
        // Get all sponsor user_ids for lookup
        const sponsorIds = [...new Set(data.map((u: any) => u.sponsor_id).filter(Boolean))]
        if (sponsorIds.length === 0) {
          // No sponsors to look up, continue with empty map
          const rows = data.map((u: any) => ({
            ID: u.user_id,
            uuid: u.id,
            nombre: u.name,
            apellido: u.apellidos || '',
            correo: u.email,
            telefono: 'N/A',
            patrocinador: 'N/A',
            membership: u.membership || 'socio',
            rango_maximo: u.rank || 'Socio',
            rango_actual: u.rank || 'Socio',
            PV_actuales: Number(u.personal_pv || 0),
            CV_actuales: Number(u.personal_cv || 0),
            VG_actuales: Number(u.group_vg || 0),
            CVG: Number(u.group_vg || 0),
            activo: u.is_active ? 'Sí' : 'No',
            bonos_promotor: u.promotor_bonos || 0,
            fidelidad: u.fidelity_points || 0,
            puntos_LTP: u.ltp_points || 0,
            fecha_registro: u.enrollment_date || u.created_at,
          }))
          
          const headers = Object.keys(rows[0])
          const csvRows = rows.map((row: any) => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
          const csv = [headers.join(','), ...csvRows].join('\n')
          
          downloadCSV(csv, `onano_usuarios_${getDateString()}.csv`)
          setResult(`${rows.length} usuarios exportados`)
          setLoading(false)
          return
        }
        
        const { data: sponsors } = await supabase
          .from('users')
          .select('user_id, name, apellidos')
          .in('user_id', sponsorIds)
        
        const sponsorMap = new Map((sponsors ?? []).map((s: any) => [s.user_id, `${s.name} ${s.apellidos || ''}`.trim()]))
        
        // Process users with all fields
        const rows = data.map((u: any) => {
          const maxRank = u.achieved_ranks?.length 
            ? u.achieved_ranks.reduce((max: string, r: string) => {
                const order = ['Socio', 'Bronce', 'Plata', 'Oro', 'Platino', 'Diamante', 'Doble Diamante', 'Triple Diamante', 'Diamante Embajador', 'Doble Diamante Embajador', 'Triple Diamante Embajador']
                return order.indexOf(r) > order.indexOf(max) ? r : max
              }, 'Socio')
            : u.rank || 'Socio'
          
          return {
            ID: u.user_id,
            uuid: u.id,
            nombre: u.name,
            apellido: u.apellidos || '',
            correo: u.email,
            telefono: 'N/A',
            patrocinador: sponsorMap.get(u.sponsor_id) || 'N/A',
            membership: u.membership || 'socio',
            rango_maximo: maxRank,
            rango_actual: u.rank || 'Socio',
            PV_actuales: Number(u.personal_pv || 0),
            CV_actuales: Number(u.personal_cv || 0),
            VG_actuales: Number(u.group_vg || 0),
            CVG: Number(u.group_vg || 0), // Same as VG
            activo: u.is_active ? 'Sí' : 'No',
            bonos_promotor: u.promotor_bonos || 0,
            fidelidad: u.fidelity_points || 0,
            puntos_LTP: u.ltp_points || 0,
            fecha_registro: u.enrollment_date || u.created_at,
          }
        })
        
        const headers = Object.keys(rows[0])
        const csvRows = rows.map((row: any) => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
        const csv = [headers.join(','), ...csvRows].join('\n')
        
        downloadCSV(csv, `onano_usuarios_${getDateString()}.csv`)
        setResult(`${rows.length} usuarios exportados`)
        setLoading(false)
        return
      }

      // Other exports (ordenes, comisiones, billetera, retiros)
      const tables: Record<string, any> = {
        ordenes: supabase.from('orders').select('id, user_id, pv, cv, total_amount, status, created_at').order('created_at', { ascending: false }).limit(10000),
        comisiones: supabase.from('commissions').select('id, user_id, amount, bono_type, period_month, period_year, calculated_at, paid_at').order('calculated_at', { ascending: false }).limit(10000),
        billetera: supabase.from('wallet_transactions').select('id, user_id, type, amount, balance_after, created_at').order('created_at', { ascending: false }).limit(10000),
        retiros: supabase.from('wallet_transactions').select('id, user_id, type, amount, balance_after, created_at').eq('type', 'commission_payout').order('created_at', { ascending: false }).limit(10000),
      }
      
      const { data, error: err } = await tables[exportType]
      if (err) throw err
      if (!data || data.length === 0) { setError('Sin datos'); setLoading(false); return }
      
      const headers = Object.keys(data[0])
      const rows = data.map((row: any) => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      
      downloadCSV(csv, `onano_${exportType}_${getDateString()}.csv`)
      setResult(`${data.length} registros exportados`)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Card>
      <SectionLabel>Exportar CSV</SectionLabel>
      <div className="space-y-4">
        <select value={exportType} onChange={(e) => { setExportType(e.target.value as any); setResult(null) }}
          className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm">
          {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <button onClick={handleExport} disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: '#0CBCE5' }}>
          {loading && <Spinner />}Exportar CSV
        </button>
        {result && <p className="text-green-600 text-sm">{result}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </Card>
  )
}

// Helpers for export
function getDateString() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Tool K — Editar Orden
function EditarOrdenSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (query.length < 2) { setSearchResults([]); return }
    const isNumeric = /^\d+$/.test(query)
    let q = supabase.from('users').select('id, user_id, name, email').limit(5)
    if (isNumeric) q = q.eq('user_id', Number(query))
    else q = q.or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    const { data } = await q
    setSearchResults((data ?? []) as any[])
  }

  async function handleSelectUser(u: any) {
    setSelectedUser(u)
    setSearchResults([])
    setSearchQuery(`${u.name} (#${u.user_id})`)
    const { data } = await supabase.from('orders').select('id, pv, cv, total_amount, status, created_at').eq('user_id', u.id).limit(20)
    setOrders((data ?? []) as any[])
  }

  async function handleMarkPaid() {
    if (!selectedOrder) return
    setUpdating(true)
    setError(null)
    setResult(null)
    try {
      // Use RPC to update status and recalculate commissions
      const { data, error: rpcError } = await supabase.rpc('update_order_status', {
        p_order_id: selectedOrder.id,
        p_new_status: 'paid'
      })
      if (rpcError) throw rpcError
      const result = data as any
      if (result?.success === false) throw new Error(result.error)
      // Set payment_method to admin_set when marking as paid
      supabase
        .from('orders')
        .update({ payment_method: 'admin_set' })
        .eq('id', selectedOrder.id)
        .then(({ error }) => { if (error) console.warn('payment_method update failed', error) })
      setSelectedOrder({ ...selectedOrder, status: 'paid' })
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'paid' } : o))
      setResult('Marcada como pagada + recalculado')
    } catch (e: any) { setError(e.message) }
    finally { setUpdating(false) }
  }

  async function handleCancel() {
    if (!selectedOrder) return
    setUpdating(true)
    setError(null)
    setResult(null)
    try {
      // Use RPC to update status and recalculate commissions (reverse)
      const { data, error: rpcError } = await supabase.rpc('update_order_status', {
        p_order_id: selectedOrder.id,
        p_new_status: 'cancelled'
      })
      if (rpcError) throw rpcError
      const result = data as any
      if (result?.success === false) throw new Error(result.error)
      setSelectedOrder({ ...selectedOrder, status: 'cancelled' })
      setOrders(orders.map(o => o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o))
      setResult('Cancelada + comisiones revertidas')
    } catch (e: any) { setError(e.message) }
    finally { setUpdating(false) }
  }

  return (
    <Card>
      <SectionLabel>Editar Orden</SectionLabel>
      <div className="space-y-4">
        <input type="text" placeholder="Buscar usuario..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
          disabled={!!selectedUser} className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm"
        />
        {searchResults.length > 0 && !selectedUser && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-[18px] shadow-lg">
            {searchResults.map((u: any) => (
              <button key={u.id} onClick={() => handleSelectUser(u)} className="w-full px-4 py-2.5 text-left hover:bg-gray-50">
                {u.name} #{u.user_id}
              </button>
            ))}
          </div>
        )}
        {selectedUser && orders.length > 0 && (
          <select value={selectedOrder?.id || ''} onChange={(e) => setSelectedOrder(orders.find(o => o.id === e.target.value) || null)}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm">
            <option value="">Seleccionar...</option>
            {orders.map((o: any) => (
              <option key={o.id} value={o.id}>#{o.id.slice(-6)} - {formatCurrencyMXN(o.total_amount || 0)} - {o.status}</option>
            ))}
          </select>
        )}
        {selectedOrder && (
          <div className="rounded-[18px] bg-gray-50 p-4 space-y-2">
            <p className="text-xs text-gray-500">PV: {selectedOrder.pv} | CV: {selectedOrder.cv}</p>
            <p className="text-sm font-medium">{formatCurrencyMXN(selectedOrder.total_amount || 0)}</p>
            <p className="text-xs">Status: {selectedOrder.status}</p>
          </div>
        )}
        {selectedOrder && selectedOrder.status !== 'cancelled' && (
          <div className="flex gap-2">
            {selectedOrder.status !== 'paid' && (
              <button onClick={handleMarkPaid} disabled={updating}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white bg-green-500 disabled:opacity-60">
                {updating ? <Spinner /> : 'Pagada'}
              </button>
            )}
            <button onClick={handleCancel} disabled={updating}
              className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white bg-red-500 disabled:opacity-60">
              {updating ? <Spinner /> : 'Cancelar'}
            </button>
          </div>
        )}
        {result && <p className="text-green-600 text-sm">{result}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </Card>
  )
}

// Tool L — Tipo de Cambio
function TipoCambioSection() {
  const [rates, setRates] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('exchange_rates').select('to_currency, rate').then(({ data }) => {
      if (data) { const m: Record<string, number> = {}; data.forEach(r => { m[r.to_currency] = r.rate }); setRates(m) }
      setLoading(false)
    })
  }, [])

  function handleChange(c: string, v: string) { setRates(prev => ({ ...prev, [c]: Number(v) })) }

  async function handleSave() {
    setSaving(true)
    try {
      for (const [c, r] of Object.entries(rates)) {
        await supabase.from('exchange_rates').upsert({ from_currency: 'USD', to_currency: c, rate: r }, { onConflict: 'to_currency' })
      }
      setResult('Actualizado')
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  return (
    <Card>
      <SectionLabel>Tipo de Cambio (USD = 1)</SectionLabel>
      <div className="space-y-4">
        {loading ? <div className="py-8 text-center"><Spinner /></div> : (
          Object.entries(rates).map(([c, r]) => (
            <div key={c} className="flex justify-between py-2 px-3 rounded-[14px] bg-gray-50">
              <span className="font-semibold">{c}</span>
              <input type="number" step="0.0001" value={r} onChange={(e) => handleChange(c, e.target.value)}
                className="w-24 rounded-[14px] border px-2 py-1 text-right text-sm" />
            </div>
          ))
        )}
        <button onClick={handleSave} disabled={saving || loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: '#062A63' }}>
          {saving && <Spinner />}Guardar
        </button>
        {result && <p className="text-green-600 text-sm">{result}</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
    </Card>
  )
}

// ─── Tool M — Creador de Red ─────────────────────────────────────────────────

interface CreatedNetworkUser {
  id: string
  user_id: number
  name: string
  email: string
}

interface CreateNetworkResult {
  created_count: number
  users?: CreatedNetworkUser[]
  error?: string
  estimated_total?: number
  max_allowed?: number
}

function ToolMCrearRedSection() {
  const [rootUser, setRootUser] = useState<UserSearchResult | null>(null)
  const [directCount, setDirectCount] = useState(3)
  const [matrix, setMatrix] = useState(3)
  const [depth, setDepth] = useState(2)
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [result, setResult] = useState<CreateNetworkResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [authProgress, setAuthProgress] = useState<{ done: number; total: number } | null>(null)

  function calcTotal(): number {
    let total = 0
    // Level 1: directCount nodes
    // Levels 2..depth: each node has `matrix` children
    let levelCount = directCount
    for (let lvl = 1; lvl <= depth; lvl++) {
      total += levelCount
      if (lvl < depth) levelCount = levelCount * matrix
    }
    return total
  }

  const totalToCreate = calcTotal()
  const MAX_NETWORK = 5000
  const exceedsLimit = totalToCreate > MAX_NETWORK

  async function handleGenerate() {
    if (!rootUser) return
    setError(null)
    setResult(null)
    setConfirmed(false)
    setAuthProgress(null)
    // Just show preview — actual creation triggered by confirm
    setConfirmed(false)
  }

  async function handleConfirm() {
    if (!rootUser) return
    setLoading(true)
    setError(null)
    setResult(null)
    setAuthProgress(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('create_network', {
        p_root_user_id: rootUser.id,
        p_direct_count: directCount,
        p_matrix: matrix,
        p_depth: depth,
      })
      if (rpcError) {
        // 409 Conflict: likely duplicate emails from a previous run
        const msg = rpcError.code === '23505' || rpcError.message?.includes('duplicate') || rpcError.message?.includes('unique')
          ? `Conflicto: emails duplicados (${rpcError.message}). Ejecuta en la DB: SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users)); y vuelve a intentarlo.`
          : rpcError.message
        throw new Error(msg)
      }
      const rpcResult = data as CreateNetworkResult
      if (rpcResult.error) {
        throw new Error(rpcResult.error)
      }
      setResult(rpcResult)
      setConfirmed(false)
      setLoading(false)

      // Create Auth users (only if list returned — skipped for large networks)
      if (rpcResult.users && rpcResult.users.length > 0) {
        setAuthLoading(true)
        setAuthProgress({ done: 0, total: rpcResult.users.length })
        let done = 0
        for (const u of rpcResult.users) {
          try {
            await supabase.auth.admin.createUser({
              email: u.email,
              password: 'Onano1234$',
              email_confirm: true,
            })
          } catch {
            // Non-blocking — continue even if one fails
          }
          done++
          setAuthProgress({ done, total: rpcResult.users.length })
        }
        setAuthLoading(false)
        setAuthProgress(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setLoading(false)
      setAuthLoading(false)
    }
  }

  const canGenerate = !!rootUser && directCount >= 1 && depth >= 1

  return (
    <Card>
      <SectionLabel>Tool M — Creador de Red</SectionLabel>
      <div className="space-y-4">
        {/* Root user picker */}
        <UserSearchField
          label="Usuario raíz"
          value={rootUser}
          onSelect={(u) => { setRootUser(u); setConfirmed(false); setResult(null); setError(null) }}
          onClear={() => { setRootUser(null); setConfirmed(false); setResult(null); setError(null) }}
        />

        {/* Direct count */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Directos del raíz (1–10)
          </label>
          <input
            type="number"
            min={1}
            max={10}
            value={directCount}
            onChange={(e) => { setDirectCount(Math.max(1, Math.min(10, Number(e.target.value)))); setConfirmed(false) }}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          />
        </div>

        {/* Matrix */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Matriz (hijos por nodo desde nivel 2)
          </label>
          <select
            value={matrix}
            onChange={(e) => { setMatrix(Number(e.target.value)); setConfirmed(false) }}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}×{n}</option>
            ))}
          </select>
        </div>

        {/* Depth */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Niveles de profundidad (mínimo 1, sin contar el raíz)
          </label>
          <input
            type="number"
            min={1}
            value={depth}
            onChange={(e) => { setDepth(Math.max(1, Number(e.target.value))); setConfirmed(false) }}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          />
        </div>

        {/* Generate button */}
        <button
          onClick={() => { if (canGenerate) setConfirmed(true) }}
          disabled={!canGenerate || loading || exceedsLimit}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
          style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Generar Red
        </button>

        {/* Limit warning */}
        {exceedsLimit && (
          <div className="rounded-[18px] bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
            ⚠️ La red estimada ({formatNumber(totalToCreate)} usuarios) excede el límite de {formatNumber(MAX_NETWORK)}. Reduce la profundidad o la matriz.
          </div>
        )}

        {/* Preview */}
        {confirmed && !result && (
          <div className="rounded-[18px] bg-[#EFF6FF] border border-[#062A63]/20 p-4 space-y-3">
            <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
              Vista previa
            </p>
            <p className="text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
              Se crearán <span className="font-bold text-[#062A63]">{formatNumber(totalToCreate)}</span> usuarios nuevos
            </p>
            <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Raíz: {rootUser?.name} #{rootUser?.user_id} · {directCount} directos · {depth} niveles · matriz {matrix}×{matrix}
            </p>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
              style={{ background: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}
            >
              {loading && <Spinner />}
              Confirmar y Crear
            </button>
          </div>
        )}

        {/* Auth creation progress */}
        {authLoading && authProgress && (
          <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] p-4 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <div className="flex items-center gap-2 mb-2">
              <Spinner />
              <span style={{ color: '#383A3F' }}>
                Creando cuentas Auth… {authProgress.done}/{authProgress.total}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-[#EAECF0] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${(authProgress.done / authProgress.total) * 100}%`, background: '#0CBCE5' }}
              />
            </div>
          </div>
        )}

        {/* Result */}
        {result && !authLoading && (
          <div className="rounded-[18px] bg-green-50 border border-green-200 p-4 space-y-3">
            <p className="font-semibold text-green-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
              ✓ {result.created_count} usuarios creados y agregados al Holding Tank
            </p>
            {result.users && result.users.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {result.users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between text-xs py-1 border-b border-green-100 last:border-0">
                    <span className="font-medium text-green-800">#{u.user_id} {u.name}</span>
                    <span className="text-green-600">{u.email}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-4 text-sm text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
            {error}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Section Config — Configuración (Comisiones, Impuestos, Cierres) ─────────

/** Bono types used in admin_settings keys — mirrors the monthly-closure Edge Function */
const BONO_TYPES = [
  { id: 'patrocinio', label: 'Patrocinio' },
  { id: 'uninivel', label: 'Uninivel' },
  { id: 'match', label: 'Match' },
  { id: 'infinito_patrocinio', label: 'Infinito Patrocinio' },
  { id: 'infinito_uninivel', label: 'Infinito Uninivel' },
  { id: 'fidelidad', label: 'Fidelidad' },
  { id: 'promotor', label: 'Promotor' },
  { id: 'avance_rango', label: 'Avance de Rango' },
] as const

/** Commission levels per bono type — used to build admin_settings keys */
const BONO_LEVELS: Record<string, number[]> = {
  patrocinio: [1, 2, 3],
  uninivel: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  match: [1],
  infinito_patrocinio: [1],
  infinito_uninivel: [1],
  fidelidad: [1],
  promotor: [1],
  avance_rango: [1],
}

// ── Config Section: Comisiones ───────────────────────────────────────────────

function ComisionesSubSection() {
  const { settings, loading } = useAdminSettings()
  const updateSetting = useUpdateAdminSetting()
  const [saving, setSaving] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function handleSave(bonoType: string) {
    setSaving(bonoType)
    setResult(null)
    try {
      const keys = BONO_LEVELS[bonoType] ?? [1]
      // Save each level's value
      for (const level of keys) {
        const key = level === 1 ? `commission.pct.${bonoType}` : `commission.pct.${bonoType}_l${level}`
        const input = document.getElementById(key) as HTMLInputElement
        if (input && input.value !== '') {
          await updateSetting.mutateAsync({ key, value: String(Number(input.value) / 100) })
        }
      }
      setResult(`Porcentajes de ${bonoType} guardados`)
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : 'Desconocido'}`)
    } finally {
      setSaving(null)
    }
  }

  function getPct(key: string): string {
    const raw = settings[key]
    if (!raw) return ''
    return String(Number(raw) * 100)
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[18px] bg-[#F2F4F9] h-12 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {BONO_TYPES.map((bono) => {
        const levels = BONO_LEVELS[bono.id] ?? [1]
        return (
          <div key={bono.id} className="rounded-[24px] border border-[#EAECF0] bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                {bono.label}
              </p>
              <button
                onClick={() => handleSave(bono.id)}
                disabled={saving === bono.id}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
                style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                {saving === bono.id ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
            <div className="flex flex-wrap gap-3">
              {levels.map((level) => {
                const key = level === 1 ? `commission.pct.${bono.id}` : `commission.pct.${bono.id}_l${level}`
                return (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <label className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
                      Nivel {level}
                    </label>
                    <div className="relative">
                      <input
                        id={key}
                        type="number"
                        defaultValue={getPct(key)}
                        min={0}
                        max={100}
                        step={0.1}
                        className="w-20 rounded-[14px] border border-[#EAECF0] px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
                        style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
      {result && (
        <div className="rounded-[18px] bg-green-50 border border-green-200 p-3 text-sm text-green-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {result}
        </div>
      )}
      <p className="text-xs italic" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
        Nota: Los cambios aplicarán en el siguiente ciclo de comisiones
      </p>
    </div>
  )
}

// ── Config Section: Impuestos por País ───────────────────────────────────────

interface TaxRow {
  id: string
  country: string
  rate: number
  label: string
}

function ImpuestosSubSection() {
  const [taxes, setTaxes] = useState<TaxRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function fetchTaxes() {
      try {
        const { data, error: err } = await supabase
          .from('taxes')
          .select('id, country, rate, label')
          .order('country')
        if (err) throw err
        if (!cancelled) setTaxes((data ?? []) as TaxRow[])
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error al cargar impuestos')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchTaxes()
    return () => { cancelled = true }
  }, [])

  return (
    <div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-[14px] bg-[#F2F4F9] h-10 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[18px] bg-red-50 border border-red-200 p-3 text-sm text-red-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {error}
        </div>
      ) : taxes.length === 0 ? (
        <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] p-4 text-center text-sm text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
          No hay tasas de impuestos configuradas
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[18px] border border-[#EAECF0]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F2F4F9]">
                {['País', 'Tasa', 'Etiqueta'].map(h => (
                  <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wide" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taxes.map((t) => (
                <tr key={t.id} className="border-t border-[#EAECF0]">
                  <td className="py-2.5 px-4 font-medium" style={{ color: '#383A3F' }}>{t.country}</td>
                  <td className="py-2.5 px-4">{(Number(t.rate) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-gray-500">{t.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Config Section: Fechas de Cierre por Bono ────────────────────────────────

function CierresSubSection() {
  const { settings, loading } = useAdminSettings()
  const updateSetting = useUpdateAdminSetting()
  const [saving, setSaving] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  function getDay(bonoType: string): string {
    const key = `closure.date.${bonoType}`
    const raw = settings[key]
    if (raw) return raw
    // Fallback to closure.date.default (0 = end of month)
    const def = settings['closure.date.default']
    return def ?? '0'
  }

  async function handleSave(bonoType: string) {
    setSaving(bonoType)
    setResult(null)
    try {
      const input = document.getElementById(`closure-${bonoType}`) as HTMLInputElement
      if (input) {
        const key = `closure.date.${bonoType}`
        await updateSetting.mutateAsync({ key, value: input.value })
        setResult(`Fecha de cierre para ${bonoType} guardada`)
      }
    } catch (e) {
      setResult(`Error: ${e instanceof Error ? e.message : 'Desconocido'}`)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[18px] bg-[#F2F4F9] h-12 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {BONO_TYPES.map((bono) => {
        const day = getDay(bono.id)
        return (
          <div key={bono.id} className="flex items-center justify-between rounded-[24px] border border-[#EAECF0] bg-white p-4">
            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold min-w-[140px]" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                {bono.label}
              </p>
              <div className="flex items-center gap-2">
                <input
                  id={`closure-${bono.id}`}
                  type="number"
                  defaultValue={day}
                  min={0}
                  max={28}
                  className="w-16 rounded-[14px] border border-[#EAECF0] px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
                  style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                />
                <span className="text-xs text-gray-400">día del mes</span>
              </div>
            </div>
            <button
              onClick={() => handleSave(bono.id)}
              disabled={saving === bono.id}
              className="px-4 py-1.5 rounded-full text-xs font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
              style={{ background: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}
            >
              {saving === bono.id ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )
      })}
      <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] p-3 text-xs text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Valor 0 = Fin de mes (cierre el día 1 del siguiente mes)
      </div>
      {result && (
        <div className="rounded-[18px] bg-green-50 border border-green-200 p-3 text-sm text-green-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {result}
        </div>
      )}
    </div>
  )
}

// ── Config Section: Main container with sub-tabs ────────────────────────────

function ConfiguracionSection() {
  const [subTab, setSubTab] = useState<'comisiones' | 'impuestos' | 'cierres'>('comisiones')

  const subTabs: { id: typeof subTab; label: string }[] = [
    { id: 'comisiones', label: 'Comisiones' },
    { id: 'impuestos', label: 'Impuestos por País' },
    { id: 'cierres', label: 'Fechas de Cierre' },
  ]

  return (
    <Card>
      <SectionLabel>Configuración</SectionLabel>
      {/* Sub-tab nav */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
            style={{
              background: subTab === t.id ? '#062A63' : '#F2F4F9',
              color: subTab === t.id ? '#fff' : '#383A3F',
              border: subTab === t.id ? 'none' : '1px solid #EAECF0',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {subTab === 'comisiones' && <ComisionesSubSection />}
      {subTab === 'impuestos' && <ImpuestosSubSection />}
      {subTab === 'cierres' && <CierresSubSection />}
    </Card>
  )
}

// ─── Section Roles — Role Assignment ──────────────────────────────────────────

interface RoleUserResult {
  id: string
  user_id: number
  name: string
  email: string
  is_supervisor: boolean
  is_support: boolean
}

function RolesSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([])
  const [selectedUser, setSelectedUser] = useState<RoleUserResult | null>(null)
  const [isSupervisor, setIsSupervisor] = useState(false)
  const [isSupport, setIsSupport] = useState(false)
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  async function handleSearch(query: string) {
    setSearchQuery(query)
    setSelectedUser(null)
    if (query.length < 2) { setSearchResults([]); return }
    setSearching(true)
    try {
      const isNumeric = /^\d+$/.test(query)
      let q = supabase.from('users').select('id, user_id, name, apellidos, email, is_supervisor, is_support').limit(5)
      if (isNumeric) { q = q.eq('user_id', Number(query)) as any }
      else { q = q.or(`name.ilike.%${query}%,email.ilike.%${query}%`) as any }
      const { data } = await q
      setSearchResults((data as UserSearchResult[]) ?? [])
    } finally { setSearching(false) }
  }

  async function handleSelectUser(u: UserSearchResult) {
    // Fetch full user data with role fields
    setSearching(true)
    try {
      const { data } = await supabase
        .from('users')
        .select('id, user_id, name, email, is_supervisor, is_support')
        .eq('id', u.id)
        .single()
      if (data) {
        const user = data as RoleUserResult
        setSelectedUser(user)
        setIsSupervisor(user.is_supervisor ?? false)
        setIsSupport(user.is_support ?? false)
        setSearchResults([])
        setSearchQuery(`${user.name} (#${user.user_id})`.trim())
        // Fetch audit log for this user
        fetchAuditLog(user.id)
      }
    } finally { setSearching(false) }
  }

  async function fetchAuditLog(userId: string) {
    setAuditLoading(true)
    try {
      const { data } = await supabase
        .from('role_changes')
        .select('id, old_roles, new_roles, changed_at, changed_by')
        .eq('user_id', userId)
        .order('changed_at', { ascending: false })
        .limit(20)
      setAuditLog((data ?? []) as any[])
    } finally { setAuditLoading(false) }
  }

  function handleClear() {
    setSelectedUser(null)
    setSearchQuery('')
    setSearchResults([])
    setResult(null)
    setError(null)
    setAuditLog([])
  }

  async function handleSave() {
    if (!selectedUser) return
    setSaving(true)
    setError(null)
    setResult(null)
    try {
      // Capture old roles before update
      const oldRoles = {
        is_supervisor: selectedUser.is_supervisor ?? false,
        is_support: selectedUser.is_support ?? false,
      }
      const newRoles = { is_supervisor, is_support }

      // Update user roles
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_supervisor, is_support })
        .eq('id', selectedUser.id)
      if (updateError) throw updateError

      // Insert audit record
      const { error: auditError } = await supabase
        .from('role_changes')
        .insert({
          user_id: selectedUser.id,
          old_roles: oldRoles,
          new_roles: newRoles,
        })
      if (auditError) throw auditError

      setSelectedUser({ ...selectedUser, is_supervisor, is_support })
      setResult('Roles actualizados correctamente')
      // Refresh audit log
      fetchAuditLog(selectedUser.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar roles')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <SectionLabel>Asignación de Roles</SectionLabel>
      <div className="space-y-4">
        {/* User search */}
        <div className="relative">
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Usuario
          </label>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o ID..."
            value={selectedUser ? `${selectedUser.name} (#${selectedUser.user_id})` : searchQuery}
            onChange={(e) => { if (!selectedUser) handleSearch(e.target.value) }}
            disabled={!!selectedUser}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20 disabled:bg-[#F2F4F9]"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          />
          {selectedUser && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-9 text-xs text-gray-400 hover:text-gray-600"
            >
              X
            </button>
          )}
          {searchResults.length > 0 && !selectedUser && (
            <div
              className="absolute z-10 top-full left-0 right-0 mt-1 rounded-[18px] overflow-hidden shadow-lg"
              style={{ background: '#fff', border: '1px solid #EAECF0' }}
            >
              {searchResults.map((u) => (
                <button
                  key={u.id}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#F2F4F9] transition-colors text-left"
                  onClick={() => handleSelectUser(u)}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: '#062A63' }}
                  >
                    {((u.name?.[0] ?? '') + (u.apellidos?.[0] ?? '')).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                      {u.name} {u.apellidos}
                    </p>
                    <p className="text-xs text-gray-400">#{u.user_id} · {u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searching && (
            <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'Poppins, sans-serif' }}>Buscando...</p>
          )}
        </div>

        {/* Selected user card with role toggles */}
        {selectedUser && (
          <>
            <div className="rounded-[18px] bg-[#F2F4F9] border border-[#EAECF0] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: '#062A63' }}
                >
                  {((selectedUser.name?.[0] ?? '')).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                    {selectedUser.name}
                  </p>
                  <p className="text-xs text-gray-400">#{selectedUser.user_id} · {selectedUser.email}</p>
                </div>
              </div>

              <div className="border-t border-[#EAECF0] pt-3 space-y-3">
                {/* Supervisor toggle */}
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                      Supervisor
                    </p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Acceso a administración + gestión de usuarios
                    </p>
                  </div>
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isSupervisor ? 'bg-[#0CBCE5]' : 'bg-[#EAECF0]'}`}
                    onClick={() => setIsSupervisor(v => !v)}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isSupervisor ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </label>

                {/* Support toggle */}
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                      Soporte
                    </p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Acceso de solo lectura al panel de administración
                    </p>
                  </div>
                  <div
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isSupport ? 'bg-[#0CBCE5]' : 'bg-[#EAECF0]'}`}
                    onClick={() => setIsSupport(v => !v)}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${isSupport ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </div>
                </label>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
                style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                {saving && <Spinner />}
                Guardar Roles
              </button>
            </div>

            {/* Audit log */}
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'rgba(56,58,63,0.60)', fontFamily: 'Poppins, sans-serif' }}>
                Historial de cambios
              </p>
              {auditLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 rounded-[14px] bg-[#F2F4F9] animate-pulse" />
                  ))}
                </div>
              ) : auditLog.length === 0 ? (
                <p className="text-xs text-gray-400" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Sin cambios registrados
                </p>
              ) : (
                <div className="space-y-2">
                  {auditLog.map((entry: any) => {
                    const oldR = entry.old_roles ?? {}
                    const newR = entry.new_roles ?? {}
                    return (
                      <div key={entry.id} className="rounded-[14px] bg-[#F2F4F9] border border-[#EAECF0] p-3 text-xs space-y-1">
                        <p className="font-medium" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                          {new Date(entry.changed_at).toLocaleString('es-MX')}
                        </p>
                        <div className="flex gap-4">
                          {oldR.is_supervisor !== newR.is_supervisor && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{ background: newR.is_supervisor ? 'rgba(12,188,229,0.1)' : 'rgba(239,68,68,0.1)', color: newR.is_supervisor ? '#0CBCE5' : '#EF4444' }}
                            >
                              Supervisor: {oldR.is_supervisor ? 'Sí' : 'No'} → {newR.is_supervisor ? 'Sí' : 'No'}
                            </span>
                          )}
                          {oldR.is_support !== newR.is_support && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{ background: newR.is_support ? 'rgba(12,188,229,0.1)' : 'rgba(239,68,68,0.1)', color: newR.is_support ? '#0CBCE5' : '#EF4444' }}
                            >
                              Soporte: {oldR.is_support ? 'Sí' : 'No'} → {newR.is_support ? 'Sí' : 'No'}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {result && (
          <div className="rounded-[18px] bg-green-50 border border-green-200 p-4 text-sm text-green-700">
            {result}
          </div>
        )}
        {error && (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('cierre')

  return (
    <main className="bg-[#F2F4F9] min-h-screen font-[Poppins,sans-serif] pb-32">
      {/* Header */}
      <div className="bg-white border-b border-[#EAECF0] px-5 pt-12 pb-4 sticky top-0 z-10">
        <h1
          className="text-xl font-bold mb-4"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Panel Administrador
        </h1>
        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
              style={{
                background: activeTab === tab.id ? '#062A63' : '#F2F4F9',
                color: activeTab === tab.id ? '#fff' : '#383A3F',
                fontFamily: 'Poppins, sans-serif',
                border: activeTab === tab.id ? 'none' : '1px solid #EAECF0',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-6 space-y-4">
        {activeTab === 'cierre' && <CierreDeMessSection />}
        {activeTab === 'pagos' && <PagarComisionesSection />}
        {activeTab === 'billetera' && <AbonarBilleteraSection />}
        {activeTab === 'stats' && <EstadisticasSection />}
        {activeTab === 'asignar' && <AsignarOrdenSection />}
        {activeTab === 'patrocinio' && <CederPatrocinioSection />}
        {activeTab === 'holding' && <HoldingTankSection />}
        {activeTab === 'datos' && <VerDatosUsuarioSection />}
        {activeTab === 'config' && <ConfiguracionSection />}
        {activeTab === 'roles' && <RolesSection />}
        {activeTab === 'exportar' && <ExportarCSvSection />}
        {activeTab === 'orden' && <EditarOrdenSection />}
        {activeTab === 'cambio' && <TipoCambioSection />}
        {activeTab === 'red' && <ToolMCrearRedSection />}
      </div>
    </main>
  )
}
