import { useState, useEffect } from 'react'
import { User, GitBranch, Users } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

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
            <p className="font-semibold text-[#062A63]">✅ Cierre completado</p>
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
            <p className="font-semibold text-[#062A63]">✅ Pagos procesados</p>
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
  const [amount, setAmount] = useState<number>(0)
  const [typeLabel, setTypeLabel] = useState<DepositTypeLabel>('Crédito manual')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<DepositResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSearch(query: string) {
    setSearchQuery(query)
    setSelectedUser(null)
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

  function handleSelectUser(u: UserSearchResult) {
    setSelectedUser(u)
    setSearchResults([])
    setSearchQuery(`${u.name} ${u.apellidos ?? ''} (#${u.user_id})`.trim())
  }

  async function handleAbonar() {
    if (!session || !selectedUser || amount < 1) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          amount,
          type: DEPOSIT_TYPE_MAP[typeLabel],
          description: description || undefined,
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

  const initials = selectedUser
    ? (selectedUser.name?.[0] ?? '') + (selectedUser.apellidos?.[0] ?? '')
    : ''

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
              onClick={() => { setSelectedUser(null); setSearchQuery('') }}
              className="absolute right-3 top-9 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
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

        {/* Amount */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Monto (MXN)
          </label>
          <input
            type="number"
            min={1}
            value={amount || ''}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0.00"
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          />
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
            <p className="font-semibold text-[#062A63]">✅ Abono realizado</p>
            <p style={{ color: '#383A3F' }}>Nuevo saldo: {formatCurrencyMXN(result.new_balance)}</p>
            <p style={{ color: '#383A3F' }}>ID transacción: {result.transaction_id}</p>
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

// ─── Section D — Estadísticas ─────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number
  ordersThisMonth: number
  pendingCommissions: number
  totalWalletBalance: number
}

function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useState(() => {
    let cancelled = false
    async function fetchStats() {
      try {
        const now = new Date()
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const [usersRes, ordersRes, commissionsRes, walletsRes] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', firstOfMonth),
          supabase.from('commissions').select('id', { count: 'exact', head: true }).is('paid_at', null).not('calculated_at', 'is', null),
          supabase.from('wallets').select('balance'),
        ])

        if (cancelled) return

        const totalBalance = (walletsRes.data ?? []).reduce(
          (sum: number, w: { balance: number }) => sum + (w.balance ?? 0),
          0
        )

        setStats({
          totalUsers: usersRes.count ?? 0,
          ordersThisMonth: ordersRes.count ?? 0,
          pendingCommissions: commissionsRes.count ?? 0,
          totalWalletBalance: totalBalance,
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
          ? Array.from({ length: 4 }).map((_, i) => (
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
                ✕
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
              ✅ {result.orders_created ?? result.users_count} órdenes creadas · {result.total_pv} PV total · {formatCurrencyMXN(result.total_amount)}
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
          ✕
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
      setResult(`✅ Patrocinio cedido: ${memberUser.name} ${memberUser.apellidos ?? ''} ahora está bajo ${sponsorUser.name} ${sponsorUser.apellidos ?? ''}`)
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
          ⚠️ Esta acción moverá al usuario y todos sus descendientes bajo el nuevo patrocinador
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

  useEffect(() => { loadConfig() }, [])

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
      setResult('✅ Reinicio programado correctamente')
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
      setResult('✅ Reinicio cancelado')
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
      setResult('✅ Holding tank reiniciado. Usuarios colocados bajo sus patrocinadores.')
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
      </div>
    </Card>
  )
}

// ─── Tab Nav ──────────────────────────────────────────────────────────────────

type TabId = 'cierre' | 'pagos' | 'billetera' | 'stats' | 'asignar' | 'patrocinio' | 'holding'

const TABS: { id: TabId; label: string }[] = [
  { id: 'cierre', label: 'Cierre Mes' },
  { id: 'pagos', label: 'Comisiones' },
  { id: 'billetera', label: 'Billetera' },
  { id: 'stats', label: 'Estadísticas' },
  { id: 'asignar', label: 'Asignar Orden' },
  { id: 'patrocinio', label: 'Patrocinio' },
  { id: 'holding', label: 'Holding Tank' },
]

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
      </div>
    </main>
  )
}
