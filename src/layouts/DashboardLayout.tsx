import { Outlet } from '@tanstack/react-router'
import { cn } from '../lib/utils'
import { useIsDesktop } from '../hooks/useMediaQuery'
import { useLayoutStore } from './store.ts'
import { useAuth } from '../modules/auth/hooks/useAuth.ts'
import { useProfile } from '../modules/auth/hooks/useProfile.ts'
import { Sidebar } from './Sidebar.tsx'
import TopBar from './TopBar.tsx'
import { BottomNav } from './BottomNav.tsx'

function MembershipBadge({ membership }: { membership: string | null }) {
  if (!membership || membership === 'socio') return null

  const isCP = membership === 'cliente_preferente'
  const label = isCP ? 'Cliente Preferente' : 'Membresía Pendiente'
  const bgColor = isCP ? 'bg-[#0CBCE5]/10' : 'bg-amber-100'
  const textColor = isCP ? 'text-[#0CBCE5]' : 'text-amber-700'

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide',
        bgColor,
        textColor,
      )}
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {label}
    </span>
  )
}

/**
 * Responsive layout wrapper that orchestrates:
 * - Desktop (≥768px): Sidebar + TopBar + content area
 * - Mobile (<768px): TopBar + content + BottomNav (preserves existing Layout.tsx pattern)
 */
export default function DashboardLayout() {
  const isDesktop = useIsDesktop()
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed)
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? '')

  // ── Desktop: sidebar + content ──────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="flex min-h-screen bg-[#F2F4F9]">
        <Sidebar />
        <main
          className="flex-1 overflow-auto transition-all duration-200 ease-in-out"
          style={{ marginLeft: sidebarCollapsed ? 68 : 240 }}
        >
          <TopBar />
          <div className="max-w-[1920px] mx-auto px-4 py-6">
            <div className="flex items-center gap-2 mb-4 md:hidden">
              <MembershipBadge membership={profile?.membership ?? null} />
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    )
  }

  // ── Mobile: TopBar + content + BottomNav ────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F2F4F9]">
      <TopBar />
      <div
        className="max-w-[1920px] mx-auto px-4 py-6"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <MembershipBadge membership={profile?.membership ?? null} />
        </div>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
