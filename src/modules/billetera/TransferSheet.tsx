import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface TransferSheetProps {
  open: boolean
  onClose: () => void
  fromWallet: { id: string; balance: number; currency: string }
  fromUserId: string
}

interface RecipientUser {
  id: string
  user_id: number
  name: string
  apellidos: string | null
  email: string
}

function Spinner() {
  return <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
}

export function TransferSheet({ open, onClose, fromWallet, fromUserId }: TransferSheetProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<RecipientUser[]>([])
  const [recipient, setRecipient] = useState<RecipientUser | null>(null)
  const [recipientCurrency, setRecipientCurrency] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [previewAmount, setPreviewAmount] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) {
      setSearchQuery('')
      setSearchResults([])
      setRecipient(null)
      setRecipientCurrency(null)
      setAmount('')
      setPreviewAmount(null)
      setNote('')
      setError(null)
      setSuccess(false)
    }
  }, [open])

  async function handleSearch(query: string) {
    setSearchQuery(query)
    setRecipient(null)
    setRecipientCurrency(null)
    setPreviewAmount(null)
    if (query.length < 2) { setSearchResults([]); return }
    const isNumeric = /^\d+$/.test(query)
    let q = supabase.from('users').select('id, user_id, name, apellidos, email').limit(5)
    if (isNumeric) q = q.eq('user_id', Number(query))
    else q = q.or(`name.ilike.%${query}%,email.ilike.%${query}%,apellidos.ilike.%${query}%`)
    const { data } = await q
    setSearchResults((data as RecipientUser[]) ?? [])
  }

  async function handleSelectRecipient(u: RecipientUser) {
    setRecipient(u)
    setSearchResults([])
    setSearchQuery(`${u.name} ${u.apellidos ?? ''} (#${u.user_id})`.trim())
    // Fetch recipient wallet currency
    const { data } = await supabase
      .from('wallets')
      .select('currency')
      .eq('user_id', u.id)
      .limit(1)
      .single()
    setRecipientCurrency(data?.currency ?? null)
  }

  useEffect(() => {
    if (!recipient || !recipientCurrency || !amount || Number(amount) <= 0) {
      setPreviewAmount(null)
      return
    }
    if (fromWallet.currency === recipientCurrency) {
      setPreviewAmount(Number(amount))
      return
    }
    setPreviewLoading(true)
    supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', fromWallet.currency)
      .eq('to_currency', recipientCurrency)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setPreviewAmount(Number(amount) * data.rate)
        else setPreviewAmount(null)
      })
      .finally(() => setPreviewLoading(false))
  }, [recipient, recipientCurrency, amount, fromWallet.currency])

  async function handleConfirm() {
    if (!recipient || !amount || Number(amount) <= 0) return
    setLoading(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('internal_transfer', {
        p_from_user_id: fromUserId,
        p_to_user_id: recipient.id,
        p_amount: Number(amount),
        p_note: note || null,
      })
      if (rpcError) throw new Error(rpcError.message)
      const result = data as { success: boolean; error?: string }
      if (!result.success) throw new Error(result.error ?? 'Error en transferencia')
      setSuccess(true)
      setTimeout(onClose, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-t-[32px] bg-white p-6 space-y-4"
        style={{ fontFamily: 'Poppins, sans-serif', boxShadow: '0 -4px 32px rgba(6,42,99,0.12)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold" style={{ color: '#062A63' }}>Transferir fondos</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X size={18} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        <div className="rounded-[18px] bg-[#F2F4F9] p-3 text-sm">
          <span className="text-gray-500">Saldo disponible: </span>
          <span className="font-bold" style={{ color: '#062A63' }}>
            {Number(fromWallet.balance).toFixed(2)} {fromWallet.currency}
          </span>
        </div>

        {/* Recipient search */}
        <div className="relative">
          <label className="text-xs text-gray-500 mb-1 block">Destinatario</label>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o ID..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={!!recipient}
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20 disabled:bg-[#F2F4F9]"
            style={{ color: '#383A3F' }}
          />
          {recipient && (
            <button
              onClick={() => { setRecipient(null); setSearchQuery(''); setRecipientCurrency(null); setPreviewAmount(null) }}
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
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#F2F4F9] text-left"
                  onClick={() => handleSelectRecipient(u)}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-[#062A63]">
                    {((u.name?.[0] ?? '') + (u.apellidos?.[0] ?? '')).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: '#383A3F' }}>{u.name} {u.apellidos}</p>
                    <p className="text-xs text-gray-400">#{u.user_id} · {u.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {recipient && recipientCurrency && (
            <p className="text-xs text-gray-500 mt-1">
              Billetera destino: <span className="font-semibold">{recipientCurrency}</span>
            </p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Monto ({fromWallet.currency})</label>
          <input
            type="number"
            min={0.01}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
            style={{ color: '#383A3F' }}
          />
        </div>

        {/* Preview */}
        {recipient && recipientCurrency && amount && Number(amount) > 0 && (
          <div className="rounded-[18px] bg-[#F2F4F9] p-3 text-sm">
            {previewLoading ? (
              <p className="text-gray-400">Calculando...</p>
            ) : previewAmount !== null ? (
              <p style={{ color: '#383A3F' }}>
                <span className="font-medium">{recipient.name}</span> recibirá{' '}
                <span className="font-bold" style={{ color: '#062A63' }}>
                  {previewAmount.toFixed(2)} {recipientCurrency}
                </span>
              </p>
            ) : (
              <p className="text-amber-600 text-xs">No se encontro tipo de cambio {fromWallet.currency} → {recipientCurrency}</p>
            )}
          </div>
        )}

        {/* Note */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Nota (opcional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Motivo de la transferencia..."
            className="w-full rounded-[18px] border border-[#EAECF0] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#062A63]/20"
            style={{ color: '#383A3F' }}
          />
        </div>

        {success ? (
          <div className="rounded-[18px] bg-green-50 border border-green-200 p-4 text-sm text-green-700">
            Transferencia realizada con exito
          </div>
        ) : (
          <button
            onClick={handleConfirm}
            disabled={loading || !recipient || !amount || Number(amount) <= 0 || Number(amount) > fromWallet.balance}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all active:scale-95"
            style={{ background: '#062A63' }}
          >
            {loading && <Spinner />}
            Confirmar transferencia
          </button>
        )}

        {error && (
          <div className="rounded-[18px] bg-red-50 border border-red-200 p-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
