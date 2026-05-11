import { BottomNav } from './BottomNav.tsx'
import TopBar from './TopBar.tsx'

interface LayoutProps {
  children: React.ReactNode
  showTopBar?: boolean
}

export function Layout({ children, showTopBar = true }: LayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#F9FAFB]">
      {showTopBar && <TopBar />}

      <div style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {children}
      </div>

      <BottomNav />
    </div>
  )
}
