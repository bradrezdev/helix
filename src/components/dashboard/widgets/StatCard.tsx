// ─── StatCard ─────────────────────────────────────────────────────────────────
// Reusable stat display: label + large value + optional delta indicator.

import { WidgetSkeleton } from './WidgetSkeleton'

interface StatCardProps {
  label: string
  value: string | number
  /** Delta string (e.g. "+12%", "-5"). Green if starts with "+", red if "-". */
  delta?: string
  isLoading?: boolean
  className?: string
}

function getDeltaColor(delta: string): string {
  if (delta.startsWith('+')) return 'text-green-600'
  if (delta.startsWith('-')) return 'text-red-500'
  return 'text-gray-500'
}

export function StatCard({ label, value, delta, isLoading, className = '' }: StatCardProps) {
  if (isLoading) return <WidgetSkeleton className={className} lines={2} />

  return (
    <div className={`rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5 ${className}`}>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-[#062A63] font-[Poppins,sans-serif] leading-tight">
        {value}
      </p>
      {delta && (
        <p className={`mt-1 text-sm font-medium ${getDeltaColor(delta)}`}>
          {delta}
        </p>
      )}
    </div>
  )
}
