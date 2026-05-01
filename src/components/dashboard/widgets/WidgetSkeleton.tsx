// ─── WidgetSkeleton ───────────────────────────────────────────────────────────
// Reusable skeleton card for dashboard widget loading states.
// Usage: <WidgetSkeleton /> or <WidgetSkeleton className="h-32" />

interface WidgetSkeletonProps {
  className?: string
  /** Number of skeleton lines to show inside the card (default: 2) */
  lines?: number
}

export function WidgetSkeleton({ className = '', lines = 2 }: WidgetSkeletonProps) {
  return (
    <div
      className={`rounded-3xl bg-white/60 p-5 shadow-sm animate-pulse ${className}`}
      aria-busy="true"
      aria-label="Cargando..."
    >
      {/* Header line */}
      <div className="mb-3 h-4 w-1/3 rounded-full bg-gray-200" />
      {/* Content lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3 rounded-full bg-gray-200 ${i < lines - 1 ? 'mb-2' : ''}`}
          style={{ width: i === 0 ? '80%' : '55%' }}
        />
      ))}
    </div>
  )
}

// ─── DashboardPageSkeleton ────────────────────────────────────────────────────
// Full-page skeleton shown while useProfile resolves (tier unknown).
// 4 placeholder cards: hero + 2 stat cards + progress bar.

export function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Hero */}
      <div className="animate-pulse rounded-[32px] bg-[#062A63]/10 p-6 shadow-sm">
        <div className="mb-3 h-5 w-2/5 rounded-full bg-[#062A63]/20" />
        <div className="h-3 w-1/4 rounded-full bg-[#062A63]/10" />
      </div>
      {/* 2 stat cards side by side */}
      <div className="grid grid-cols-2 gap-4">
        <WidgetSkeleton lines={2} />
        <WidgetSkeleton lines={2} />
      </div>
      {/* Progress bar card */}
      <div className="animate-pulse rounded-3xl bg-white/60 p-5 shadow-sm">
        <div className="mb-3 h-4 w-1/3 rounded-full bg-gray-200" />
        <div className="h-3 w-full rounded-full bg-gray-200" />
      </div>
    </div>
  )
}
