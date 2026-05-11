import { Wallet, CreditCard } from 'lucide-react'
import { useAuth } from '../../auth/hooks/useAuth.ts'
import { useWallet } from '../../finances/billetera/hooks/useWallet.ts'

export function PaymentMethodsPage() {
  const { user } = useAuth()
  const { walletsByType, loading } = useWallet(user?.id ?? null)

  const disponibleWallets = walletsByType.disponible
  const totalDisponible = disponibleWallets.reduce((sum, w) => sum + Number(w.balance), 0)

  function formatCurrency(amount: number): string {
    return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: '#F2F4F9', fontFamily: 'Poppins, sans-serif', paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <div className="bg-white border-b px-5 pt-12 pb-4" style={{ borderColor: '#EAECF0' }}>
        <h1 className="text-xl font-bold" style={{ color: '#062A63' }}>
          Métodos de pago
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
          Administra tus métodos de pago
        </p>
      </div>

      {/* Content */}
      <div className="px-4 pt-4 flex flex-col gap-3">
        {/* Wallet balance card */}
        <div className="rounded-[24px] p-5" style={{ background: '#fff', border: '1px solid #EAECF0' }}>
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(6,42,99,0.1)' }}
            >
              <Wallet size={20} style={{ color: '#062A63' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#062A63' }}>
                Billetera ONANO
              </p>
              <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
                Saldo disponible
              </p>
            </div>
          </div>

          {loading ? (
            <div className="h-9 w-28 rounded-full animate-pulse" style={{ background: '#E5E7EB' }} />
          ) : (
            <p className="text-[28px] font-bold leading-tight" style={{ color: '#062A63' }}>
              {formatCurrency(totalDisponible)}
            </p>
          )}
        </div>

        {/* Card placeholder — next available */}
        <div
          className="rounded-[24px] p-5"
          style={{ background: '#fff', border: '1px dashed #D1D5DB' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#F2F4F9' }}
            >
              <CreditCard size={20} style={{ color: '#9CA3AF' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#9CA3AF' }}>
                Tarjeta de crédito/débito
              </p>
              <p className="text-[11px]" style={{ color: '#D1D5DB' }}>
                Próximamente disponible
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
