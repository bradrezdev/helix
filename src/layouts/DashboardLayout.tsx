import { Outlet } from '@tanstack/react-router'
import { useIsDesktop } from '../hooks/useMediaQuery'
import { useLayoutStore } from './store.ts'
import { Sidebar } from './Sidebar.tsx'
import TopBar from './TopBar.tsx'
import { BottomNav } from './BottomNav.tsx'

/**
 * Responsive layout wrapper that orchestrates:
 * - Desktop (≥768px): Sidebar + TopBar + content area
 * - Mobile (<768px): TopBar + content + BottomNav (preserves existing Layout.tsx pattern)
 */
export default function DashboardLayout() {
  const isDesktop = useIsDesktop()
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed)

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
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
