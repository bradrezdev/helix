import { cn } from '../../lib/utils'

interface StatCard {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}

interface NetworkStatsBarProps {
  univelDirects: number
  sponsorDirects: number
  totalNetwork: number
  activeCount: number
  totalCount: number
  rankDistribution?: Record<string, number>
}

export function NetworkStatsBar({
  univelDirects,
  sponsorDirects,
  totalNetwork,
  activeCount,
  totalCount,
}: NetworkStatsBarProps) {
  const activePercent = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0

  const stats: StatCard[] = [
    { label: 'Directos Uninivel', value: univelDirects },
    { label: 'Directos Patrocinio', value: sponsorDirects },
    { label: 'Total Red', value: totalNetwork },
    { label: '% Activos', value: `${activePercent}%`, highlight: activePercent >= 50 },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 py-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-[32px] px-5 py-4 shadow-sm border border-gray-100 flex flex-col gap-1"
        >
          <span
            className={cn(
              'text-2xl font-semibold tracking-tight',
              stat.highlight ? 'text-[#0CBCE5]' : 'text-[#062A63]'
            )}
          >
            {stat.value}
          </span>
          <span className="text-xs text-gray-400 font-medium">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}
