// ─── TopRankosCard ────────────────────────────────────────────────────────────
// TOP 10 usuarios por rango en la red del usuario.

import { useState } from 'react'
import { TopListCard } from './TopListCard'
import { MonthDropdown } from './MonthDropdown'
import { useTopRankos } from '../../../modules/network/dashboard/hooks/useDashboardTops.ts'

interface TopRankosCardProps {
  userId: string
  isAdmin: boolean
}

export function TopRankosCard({ userId, isAdmin }: TopRankosCardProps) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data, isLoading } = useTopRankos(userId, month, year, isAdmin)

  const items = (data ?? []).map((user, i) => ({
    rank: i + 1,
    name: user.name,
    value: user.rank ?? '—',
    badge: user.rank ?? undefined,
  }))

  return (
    <div className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif]">
          TOP Rangos
        </p>
        <MonthDropdown
          selectedMonth={month}
          selectedYear={year}
          onChange={(m, y) => { setMonth(m); setYear(y) }}
        />
      </div>
      <TopListCard
        title=""
        items={items}
        isLoading={isLoading}
      />
    </div>
  )
}
