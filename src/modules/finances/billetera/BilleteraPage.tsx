import { useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, RefreshCw, Lock } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth.ts'
import { useWallet } from './hooks/useWallet.ts'
import { useWalletDetails } from './hooks/useWalletDetails.ts'
import { TransferSheet } from './TransferSheet.tsx'

function TxIcon({ type }: { type: string }) {
  const isOut = type === 'transfer_out' || type === 'order_payment' || type === 'acumulado_perdido'
  const isLocked = type === 'patrocinio_acumulado'
  if (isLocked) return <Lock size={14} style={{ color: '#D97706' }} />
  return isOut
    ? <ArrowUpRight size={14} style={{ color: '#EF4444' }} />
    : <ArrowDownLeft size={14} style={{ color: '#22C55E' }} />
}

function formatTxType(type: string): string {
  const map: Record<string, string> = {
    manual_credit: 'Abono manual',
    bonus: 'Bono',
    refund: 'Reembolso',
    commission_payout: 'Comisión',
    transfer_in: 'Transferencia recibida',
    transfer_out: 'Transferencia enviada',
    order_payment: 'Pago orden',
    patrocinio: 'Bono patrocinio',
    patrocinio_acumulado: 'Bono patrocinio (acumulado)',
    acumulado_liberado: 'Acumulado liberado',
    acumulado_perdido: 'Acumulado vencido',
  }
  return map[type] ?? type
}

export function BilleteraPage() {
  const { user } = useAuth()
  const { walletsByType, loading: walletsLoading, refetch: refetchWallets } = useWallet(user?.id ?? null)
  const { transactions, loading: txLoading, error, refetch: refetchTx } = useWalletDetails()
  const [transferOpen, setTransferOpen] = useState(false)
  const [selectedWalletIdx, setSelectedWalletIdx] = useState(0)

  const disponibleWallets = walletsByType.disponible
  const acumuladoWallets = walletsByType.acumulado
  const totalAcumulado = acumuladoWallets.reduce((sum, w) => sum + Number(w.balance), 0)
  const hasAcumulado = totalAcumulado > 0

  const primaryWallet = disponibleWallets[selectedWalletIdx] ?? null

  function handleRefetch() {
    refetchWallets()
    refetchTx()
  }

  return (
    <main className="bg-[#F2F4F9] min-h-screen pb-32" style={{ fontFamily: 'Poppins, sans-serif' }} data-testid="billetera-container">
      {/* Header */}
      <div className="bg-white border-b border-[#EAECF0] px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold" style={{ color: '#062A63' }}>Billetera</h1>
          <button
            onClick={handleRefetch}
            className="p-2 rounded-full hover:bg-[#F2F4F9] transition-colors"
          >
            <RefreshCw size={16} style={{ color: '#9CA3AF' }} />
          </button>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-4">
        {/* Disponible wallet cards */}
        {walletsLoading ? (
          <div className="rounded-[32px] bg-white h-32 animate-pulse shadow-sm" />
        ) : disponibleWallets.length === 0 ? (
          <div
            className="rounded-[32px] bg-white p-6 text-center shadow-[0_2px_12px_rgba(6,42,99,0.07)]"
            style={{ border: '1px solid #EAECF0' }}
          >
            <p className="text-gray-400 text-sm">Sin billetera activa</p>
          </div>
        ) : (
          <>
            {disponibleWallets.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {disponibleWallets.map((w, i) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWalletIdx(i)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: selectedWalletIdx === i ? '#062A63' : '#F2F4F9',
                      color: selectedWalletIdx === i ? '#fff' : '#383A3F',
                      border: selectedWalletIdx === i ? 'none' : '1px solid #EAECF0',
                    }}
                  >
                    {w.currency}
                  </button>
                ))}
              </div>
            )}
            {primaryWallet && (
              <div
                className="rounded-[32px] p-6 text-white"
                style={{ background: 'linear-gradient(135deg, #062A63 0%, #0CBCE5 100%)' }}
              >
                <p className="text-xs font-medium opacity-70 mb-1">Saldo disponible</p>
                <p className="text-3xl font-bold mb-1" data-testid="billetera-balance-disponible">
                  {Number(primaryWallet.balance).toFixed(2)}
                </p>
                <p className="text-sm font-semibold opacity-80">{primaryWallet.currency}</p>
                <button
                  onClick={() => setTransferOpen(true)}
                  className="mt-4 px-5 py-2 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 transition-colors border border-white/30"
                >
                  Transferir
                </button>
              </div>
            )}
          </>
        )}

        {/* Acumulado wallet section — only shown when balance > 0 */}
        {!walletsLoading && hasAcumulado && (
          <div
            className="rounded-[32px] p-5"
            style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: '#FEF3C7' }}
              >
                <Lock size={16} style={{ color: '#D97706' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold mb-0.5" style={{ color: '#92400E' }}>
                  Saldo Acumulado
                </p>
                <p className="text-2xl font-bold mb-1" style={{ color: '#B45309' }}>
                  {totalAcumulado.toFixed(2)}{' '}
                  <span className="text-sm font-semibold" style={{ color: '#D97706' }}>
                    {acumuladoWallets[0]?.currency ?? ''}
                  </span>
                </p>
                <p className="text-xs leading-snug" style={{ color: '#92400E', opacity: 0.8 }}>
                  Bono patrocinio pendiente de liberar. Compra 100 PV este mes para transferirlo a tu billetera disponible.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transactions */}
        <div
          className="bg-white rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-5"
          style={{ border: '1px solid #EAECF0' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: 'rgba(56,58,63,0.60)' }}>
            Movimientos recientes
          </p>

          {txLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-[18px] bg-[#F2F4F9] h-12 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm">{error}</p>
          ) : transactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4" data-testid="billetera-empty">Sin movimientos</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => {
                const isPositive = tx.amount > 0
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-2.5 px-3 rounded-[18px] bg-[#F2F4F9]" data-testid={`billetera-transaction-${tx.id}`}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white shrink-0 shadow-sm">
                      <TxIcon type={tx.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: '#383A3F' }}>
                        {formatTxType(tx.type)}
                      </p>
                      {tx.description && (
                        <p className="text-[10px] text-gray-400 truncate">{tx.description}</p>
                      )}
                      <p className="text-[10px] text-gray-400">
                        {new Date(tx.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-bold"
                        style={{ color: isPositive ? '#22C55E' : '#EF4444' }}
                      >
                        {isPositive ? '+' : ''}{Number(tx.amount).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Saldo: {Number(tx.balance_after).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Transfer Sheet */}
      {primaryWallet && user && (
        <TransferSheet
          open={transferOpen}
          onClose={() => { setTransferOpen(false); handleRefetch() }}
          fromWallet={primaryWallet}
          fromUserId={user.id}
        />
      )}
    </main>
  )
}
