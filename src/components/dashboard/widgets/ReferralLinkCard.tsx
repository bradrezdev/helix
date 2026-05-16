// ─── ReferralLinkCard ─────────────────────────────────────────────────────────
// Shows referral link (truncated) with copy-to-clipboard button.
// If referralLink is empty but userId is provided, constructs:
//   {window.location.origin}/register?sponsor={userId}
// Uses sonner for toast on success.

import { toast } from 'sonner'
import { WidgetSkeleton } from './WidgetSkeleton'

interface ReferralLinkCardProps {
  referralLink?: string
  /** User numeric ID (bigint from DB). Used to construct link if referralLink is absent. */
  userId?: number
  /** User membership type. If not 'socio', widget is hidden. */
  membership?: string
  isLoading?: boolean
  className?: string
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('¡Enlace copiado!')
  } catch {
    toast.error('No se pudo copiar el enlace')
  }
}

export function ReferralLinkCard({ referralLink, userId, membership, isLoading, className = '' }: ReferralLinkCardProps) {
  if (isLoading) return <WidgetSkeleton className={className} lines={2} />
  if (membership !== 'socio') return null

  // Construct link dynamically — DEV uses localhost port, prod uses hostname
  const baseUrl = import.meta.env.DEV
    ? `http://localhost:${window.location.port || '5173'}`
    : `https://${window.location.hostname}`

  const resolvedLink =
    userId !== undefined
      ? `${baseUrl}/register?sponsor=${userId}`
      : referralLink && referralLink.trim() !== ''
        ? referralLink
        : ''

  if (!resolvedLink) {
    return (
      <div className={`rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5 ${className}`}>
        <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif] mb-1">
          Tu enlace de referido
        </p>
        <p className="text-sm text-gray-400">Enlace no disponible aún</p>
      </div>
    )
  }

  return (
    <div className={`rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5 ${className}`}>
      <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif] mb-2">
        Tu enlace de referido
      </p>
      <div className="flex items-center gap-2">
        <p className="flex-1 truncate rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 border border-gray-100">
          {resolvedLink}
        </p>
        <button
          onClick={() => copyToClipboard(resolvedLink)}
          className="shrink-0 rounded-[32px] bg-[#0CBCE5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0CBCE5]/90 active:scale-95 transition-all"
        >
          Copiar
        </button>
      </div>
    </div>
  )
}

