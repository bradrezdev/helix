import { useState } from 'react'
import { ShoppingCart, Bell } from 'lucide-react'
import { BottomNav } from './BottomNav'
import { UserBadge, ProfileSheet } from './ProfileSheet'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useCart } from '../store/cartStore'
import { CartSheet } from '../modules/tienda/CartSheet'
import { useLocation } from '@tanstack/react-router'

interface LayoutProps {
  children: React.ReactNode
  showTopBar?: boolean
}

export function Layout({ children, showTopBar = true }: LayoutProps) {
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id ?? '')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const { count } = useCart()
  const location = useLocation()

  const displayName = profile?.name ?? user?.email ?? ''
  const cartCount = count()

  // Hide cart icon on checkout page (already there)
  const isCheckout = location.pathname === '/checkout'

  return (
    <div className="relative min-h-screen bg-[#F9FAFB]">
      {showTopBar && (
        <div
          className="fixed top-0 right-0 z-[9998] flex items-center gap-2 px-4"
          style={{ paddingTop: 'calc(12px + env(safe-area-inset-top))' }}
        >
          {/* Cart icon pill — always visible except on checkout */}
          {!isCheckout && (
            <button
              onClick={() => setCartOpen(true)}
              className="relative w-9 h-9 flex items-center justify-center rounded-full border border-[#EAECF0] bg-white/80 active:bg-gray-50 transition-colors"
              style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              <ShoppingCart size={17} style={{ color: '#062A63' }} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                  style={{ background: '#0CBCE5' }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          )}

          {/* Bell icon */}
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[#EAECF0] bg-white/80 active:bg-gray-50 transition-colors"
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            aria-label="Notificaciones"
          >
            <Bell size={20} className="text-[#383A3F]/60 hover:text-[#062A63] transition-colors" />
          </button>

          <UserBadge name={displayName} onClick={() => setSheetOpen(true)} />
        </div>
      )}

      <div style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        {children}
      </div>

      <BottomNav />

      <ProfileSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      {cartOpen && <CartSheet onClose={() => setCartOpen(false)} />}
    </div>
  )
}
