import { useState } from 'react'
import { ShoppingBag, Bell, CircleUser } from 'lucide-react'
import { useCart } from '../store/cartStore'
import { ProfileSheet } from './ProfileSheet'
import { CartSheet } from '../modules/tienda/CartSheet'
import { useLocation } from '@tanstack/react-router'

interface TopBarProps {
  className?: string
}

export default function TopBar({ className }: TopBarProps) {
  const [cartOpen, setCartOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { count } = useCart()
  const location = useLocation()

  const cartCount = count()
  const isCheckout = location.pathname === '/checkout'

  return (
    <>
      <div
        className={`fixed top-4 right-4 z-50 flex items-center gap-1 px-2 py-1.5 bg-white/80 backdrop-blur-xl rounded-full border border-[#EAECF0] shadow-sm ${className ?? ''}`}
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {/* Cart */}
        {!isCheckout && (
          <button
            onClick={() => setCartOpen(true)}
            className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F2F4F9] transition-colors"
          >
            <ShoppingBag size={18} color="#383A3F" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-semibold">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        )}

        {/* Bell */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F2F4F9] transition-colors"
          aria-label="Notificaciones"
        >
          <Bell size={18} color="#383A3F" />
        </button>

        {/* Profile */}
        <button
          onClick={() => setProfileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F2F4F9] transition-colors"
        >
          <CircleUser size={18} color="#383A3F" />
        </button>
      </div>

      {/* Sheets */}
      {cartOpen && <CartSheet onClose={() => setCartOpen(false)} />}
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}
