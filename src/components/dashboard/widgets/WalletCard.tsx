// ─── WalletCard ───────────────────────────────────────────────────────────────
// Shows wallet balance prominently with optional withdraw CTA.

import { WidgetSkeleton } from './WidgetSkeleton'
import { formatAmount } from '../../../lib/formatters'

interface WalletCardProps {
  balance: number
  currency: string
  onWithdraw?: () => void
  isLoading?: boolean
  className?: string
}

export function WalletCard({
  balance,
  currency,
  onWithdraw,
  isLoading,
  className = '',
}: WalletCardProps) {
  if (isLoading) return <WidgetSkeleton className={className} lines={2} />

  return (
    <div className={`rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5 ${className}`}>
      <p className="text-sm font-medium text-gray-500 mb-1">Saldo en billetera</p>
      <p className="text-3xl font-bold text-[#062A63] font-[Poppins,sans-serif] leading-tight">
        {formatAmount(balance, currency)}
      </p>
      {onWithdraw && (
        <button
          onClick={onWithdraw}
          className="mt-4 w-full rounded-[32px] bg-[#062A63] py-2.5 text-sm font-semibold text-white hover:bg-[#062A63]/90 active:scale-95 transition-all"
        >
          Retirar
        </button>
      )}
    </div>
  )
}
