// ─── NetworkCard ──────────────────────────────────────────────────────────────
// Network stats widget.
// simplified=true (T1): shows only totalPeople (no VG — VG shown in ProgressRankCard)
// simplified=false (T2/T3): 2x2 grid — totalPeople, %activos, directos (no VG — shown separately)

import { WidgetSkeleton } from './WidgetSkeleton'

interface NetworkCardProps {
  groupVg?: number
  totalPeople?: number
  percentActive?: number
  directs?: number
  simplified?: boolean
  isLoading?: boolean
  className?: string
}

interface StatCellProps {
  label: string
  value: string | number
}

function StatCell({ label, value }: StatCellProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xl font-bold text-[#062A63] font-[Poppins,sans-serif]">{value}</span>
      <span className="text-xs text-gray-500 mt-0.5">{label}</span>
    </div>
  )
}

export function NetworkCard({
  groupVg,
  totalPeople,
  percentActive,
  directs,
  simplified = false,
  isLoading,
  className = '',
}: NetworkCardProps) {
  if (isLoading) return <WidgetSkeleton className={className} lines={3} />

  const isEmpty = (totalPeople === undefined || totalPeople === 0) && !simplified

  return (
    <div className={`rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5 ${className}`}>
      <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif] mb-3">
        Tu red
      </p>

      {isEmpty ? (
        <p className="text-sm text-gray-400 text-center py-4">Aún no tienes red</p>
      ) : simplified ? (
        // T1: simplified — only total people (VG shown in ProgressRankCard)
        <div className="flex flex-col gap-3">
          <StatCell
            label="Personas en tu red"
            value={totalPeople !== undefined ? totalPeople.toLocaleString('es-MX') : '—'}
          />
          {(totalPeople === undefined || totalPeople === 0) && (
            <p className="text-xs text-[#0CBCE5] font-medium">
              ¡Comparte tu enlace para crecer!
            </p>
          )}
        </div>
      ) : (
        // T2/T3: full grid — totalPeople, %activos, directos (no VG — shown in separate StatCard)
        <div className="grid grid-cols-2 gap-4">
          <StatCell
            label="Total personas"
            value={totalPeople !== undefined ? totalPeople.toLocaleString('es-MX') : '—'}
          />
          <StatCell
            label="% Activos"
            value={
              percentActive !== undefined
                ? `${percentActive.toFixed(1)}%`
                : '—'
            }
          />
          <StatCell
            label="Directos"
            value={directs !== undefined ? directs.toLocaleString('es-MX') : '—'}
          />
        </div>
      )}
    </div>
  )
}
