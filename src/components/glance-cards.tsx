// ─── GlanceCard ──────────────────────────────────────────────────────────────

const ACCENT_COLORS: Record<string, string> = {
  primary: '#062A63',
  secondary: '#0CBCE5',
  success: '#32D74B',
  warning: '#FF9F0A',
}

interface GlanceCardProps {
  title: string
  value: string | number
  subtitle?: string
  accent?: 'primary' | 'secondary' | 'neutral'
  variant?: 'default' | 'filled'
  accentColor?: 'primary' | 'secondary' | 'success' | 'warning' | string
}

export function GlanceCard({
  title,
  value,
  subtitle,
  accent = 'neutral',
  variant = 'default',
  accentColor,
}: GlanceCardProps) {
  if (variant === 'filled') {
    const bg = accentColor
      ? (ACCENT_COLORS[accentColor] ?? accentColor)
      : '#062A63'
    return (
      <div
        className="rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-3 justify-items-start"
        style={{ background: bg }}
      >
        <p className='text-xs mb-1 text-white/80'>{title}</p>
        <div className="flex gap-2 justify-start">
          <h2 className='text-xl font-bold items-center text-white'>{value}</h2>
        </div>
        {subtitle && <p className='text-xs text-white/70 mt-1'>{subtitle}</p>}
      </div>
    )
  }

  const accentClass =
    accent === 'primary'
      ? 'border-l-4 border-[#062A63]'
      : accent === 'secondary'
        ? 'border-l-4 border-[#0CBCE5]'
        : ''

  return (
    <div className={`bg-white rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-3 justify-items-start ${accentClass}`}>
      <p className='text-xs mb-1 text-[#383A3F]'>{title}</p>
      <div className="flex gap-2 justify-start">
        <h2 className='text-xl font-bold items-center'>{value}</h2>
      </div>
      {subtitle && <p className='text-xs text-gray-500 mt-1'>{subtitle}</p>}
    </div>
  )
}

// ─── GlanceCardSkeleton ───────────────────────────────────────────────────────

export function GlanceCardSkeleton() {
  return (
    <div className="bg-white rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-3 animate-pulse">
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-6 bg-gray-200 rounded w-3/4" />
    </div>
  )
}

// ─── RankProgressCard ─────────────────────────────────────────────────────────

interface RankProgressCardProps {
  currentVg: number
  targetVg: number
  nextRank: string
  daysLeft: number
}

export function RankProgressCard({ currentVg, targetVg, nextRank, daysLeft }: RankProgressCardProps) {
  const isMaxRank = targetVg === Infinity
  const progress = isMaxRank ? 100 : Math.min((currentVg / targetVg) * 100, 100)

  return (
    <div className="bg-white rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-4">
      <div className="flex gap-1 justify-start items-baseline mb-2">
        <h2 className='text-xl font-bold'>{currentVg.toLocaleString('es-MX')}</h2>
        {!isMaxRank && (
          <>
            <p className='text-xl font-bold'>-</p>
            <h2 className='text-xl font-bold'>{targetVg.toLocaleString('es-MX')}</h2>
            <h2 className='text-xl font-bold'>VG</h2>
          </>
        )}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-[#062A63] h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-1">
        {isMaxRank ? (
          <p className='text-xs text-gray-600'>Rango máximo alcanzado</p>
        ) : (
          <>
            <p className='text-xs text-gray-600'>Próximo rango {nextRank}</p>
            <p className='text-xs text-gray-500'>Quedan {daysLeft} días para calificar</p>
          </>
        )}
      </div>
    </div>
  )
}
