// ─── NetworkCard ──────────────────────────────────────────────────────────────
// Network stats widget.
// simplified=true (T1): shows only totalPeople
// simplified=false (T2/T3): 2x2 grid — totalPeople, %activos, directos
// If userId is provided, fetches sponsorship network size from RPC.

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase.ts'
import { WidgetSkeleton } from './WidgetSkeleton'

interface NetworkCardProps {
  userId?: string
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
  userId,
  groupVg,
  totalPeople,
  percentActive,
  directs,
  simplified = false,
  isLoading,
  className = '',
}: NetworkCardProps) {
  // Fetch sponsorship network size from RPC when userId provided
  const { data: sponsorshipData, isLoading: sponsorshipLoading } = useQuery({
    queryKey: ['sponsorship-network-size', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase.rpc('get_sponsorship_network_size', {
        p_user_id: userId,
      })
      if (error) throw error
      return (data?.[0] ?? null) as { total_count: number; direct_count: number } | null
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })

  const networkLoading = isLoading || sponsorshipLoading

  // Use RPC data when props not provided
  const resolvedTotal = totalPeople ?? sponsorshipData?.total_count
  const resolvedDirects = directs ?? sponsorshipData?.direct_count

  if (networkLoading) return <WidgetSkeleton className={className} lines={3} />

  const isEmpty = (resolvedTotal === undefined || resolvedTotal === 0) && !simplified

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
            value={resolvedTotal !== undefined ? resolvedTotal.toLocaleString('es-MX') : '—'}
          />
          {(resolvedTotal === undefined || resolvedTotal === 0) && (
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
            value={resolvedTotal !== undefined ? resolvedTotal.toLocaleString('es-MX') : '—'}
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
            value={resolvedDirects !== undefined ? resolvedDirects.toLocaleString('es-MX') : '—'}
          />
        </div>
      )}
    </div>
  )
}
