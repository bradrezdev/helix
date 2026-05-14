// ─── TopConsumersCard ─────────────────────────────────────────────────────────
// TOP 10 consumidores por PV en el período seleccionado.

import { useState } from 'react'
import { TopListCard } from './TopListCard'
import { MonthDropdown } from './MonthDropdown'
import { useTopConsumers } from '../../../modules/network/dashboard/hooks/useDashboardTops.ts'

interface TopConsumersCardProps {
  userId: string
  userNumId: number
  isAdmin: boolean
}

export function TopConsumersCard({ userId, userNumId, isAdmin }: TopConsumersCardProps) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data, isLoading } = useTopConsumers(userId, userNumId, month, year, isAdmin)

  const items = (data ?? []).map((user, i) => ({
    rank: i + 1,
    name: user.name,
    value: `${user.total_pv.toLocaleString('es-MX')} PV`,
    badge: user.rank ?? undefined,
  }))

  return (
    <div className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(6,42,99,0.08)] p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-[#062A63] font-[Poppins,sans-serif]">
          TOP Consumidores
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
