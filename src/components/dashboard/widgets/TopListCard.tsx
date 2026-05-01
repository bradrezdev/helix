// ─── TopListCard ───────────────────────────────────────────────────────────────
// Reusable numbered list card: TOP Rangos, TOP Consumidores, TOP Reclutadores.

import { WidgetSkeleton } from './WidgetSkeleton'

export interface TopListItem {
  rank: number
  name: string
  value: string
  badge?: string
}

interface TopListCardProps {
  title: string
  items: TopListItem[]
  isLoading?: boolean
  period?: string
}

export function TopListCard({ title, items, isLoading, period }: TopListCardProps) {
  if (isLoading) return <WidgetSkeleton lines={5} />

  return (
    <div className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif]">{title}</p>
        {period && (
          <span className="text-xs text-gray-400">{period}</span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Sin datos para este período</p>
      ) : (
        <ol className="space-y-2">
          {items.map((item) => (
            <li key={item.rank} className="flex items-center gap-3">
              {/* Position number */}
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#062A63]/10 flex items-center justify-center text-xs font-bold text-[#062A63]">
                {item.rank}
              </span>

              {/* Name */}
              <span className="flex-1 text-sm text-gray-700 truncate">{item.name}</span>

              {/* Badge (rank label) */}
              {item.badge && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#0CBCE5]/10 text-[#0CBCE5] font-medium">
                  {item.badge}
                </span>
              )}

              {/* Value */}
              <span className="text-sm font-semibold text-[#062A63]">{item.value}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
