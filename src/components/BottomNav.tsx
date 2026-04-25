import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Building2,
  ShoppingBag,
  Store,
  Ellipsis,
  Library,
  ArrowDownToLine,
  Wallet,
  Plus,
  Plane,
  ShieldCheck,
  Calculator,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useIsAdmin } from '../hooks/useAdmin'

interface NavItem {
  icon: LucideIcon
  label: string
  route: string
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Inicio', route: '/' },
  { icon: Building2, label: 'Negocio', route: '/red' },
  { icon: ShoppingBag, label: 'Órdenes', route: '/ordenes' },
  { icon: Store, label: 'Tienda', route: '/tienda' },
]

const DROPDOWN_ITEMS = [
  { icon: Library, label: 'Herramientas de negocio', route: null },
  { icon: Calculator, label: 'Simulador de Ganancias', route: '/simulador' },
  { icon: ArrowDownToLine, label: 'Retiro a cuenta bancaria', route: '/retiros' },
  { icon: Wallet, label: 'Transferencia interna', route: null },
  { icon: Plus, label: 'Nuevo registro', route: null },
  { icon: Plane, label: 'Viaje de Liderazgo', route: '/herramientas' },
]

export function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id ?? '')
  const isAdmin = useIsAdmin()

  const currentPath = location.pathname

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [dropdownOpen])

  return (
    <nav
      className="fixed left-1/2 z-[9999] flex items-center px-1.5 py-1.5 gap-0.5"
      style={{
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        transform: 'translateX(-50%)',
        borderRadius: '9999px',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        background: 'rgba(255,255,255,0.92)',
        boxShadow: '0 4px 24px rgba(6,42,99,0.13), 0 1.5px 6px rgba(0,0,0,0.07)',
        border: '1px solid rgba(234,236,240,0.9)',
        maxWidth: 'calc(100vw - 32px)',
      }}
    >
      {/* Main nav items */}
      {NAV_ITEMS.map(({ icon: Icon, label, route }) => {
        const isActive = currentPath === route
        return (
          <button
            key={route}
            onClick={() => navigate({ to: route as '/' })}
            className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-full transition-all duration-150"
            style={{
              background: isActive ? 'rgba(6,42,99,0.08)' : 'transparent',
            }}
          >
            <Icon
              size={20}
              style={{ color: isActive ? '#062A63' : '#9CA3AF' }}
              strokeWidth={isActive ? 2.2 : 1.8}
            />
            <span
              className="text-[10px] font-medium"
              style={{
                color: isActive ? '#062A63' : '#9CA3AF',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {label}
            </span>
          </button>
        )
      })}

      {/* Divider */}
      <div className="w-px h-8 mx-1 rounded-full" style={{ background: '#EAECF0' }} />

      {/* More / dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-full transition-all duration-150"
          style={{
            background: dropdownOpen ? 'rgba(6,42,99,0.08)' : 'transparent',
          }}
        >
          <Ellipsis
            size={20}
            style={{ color: dropdownOpen ? '#062A63' : '#9CA3AF' }}
            strokeWidth={dropdownOpen ? 2.2 : 1.8}
          />
          <span
            className="text-[10px] font-medium"
            style={{
              color: dropdownOpen ? '#062A63' : '#9CA3AF',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            Más
          </span>
        </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 bottom-full mb-3 rounded-[32px] overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(6,42,99,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid rgba(234,236,240,0.8)',
                padding: '6px',
                minWidth: '220px',
              }}
            >
              {DROPDOWN_ITEMS.map(({ icon: Icon, label, route }) => (
                <button
                  key={label}
                  className="flex flex-row items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  onClick={() => {
                    setDropdownOpen(false)
                    if (label === 'Nuevo registro') {
                      navigate({
                        to: '/register',
                        search: {
                          sponsor: profile?.user_id ? String(profile.user_id) : undefined,
                          locked: true,
                        },
                      })
                    } else if (route) {
                      navigate({ to: route as '/' })
                    }
                  }}
                >
                  <Icon size={17} style={{ color: '#062A63' }} strokeWidth={1.8} />
                  <span
                    className="text-[13px]"
                    style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {label}
                  </span>
                </button>
              ))}
              {/* Admin link — only for admins */}
              {isAdmin && (
                <button
                  className="flex flex-row items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                  onClick={() => {
                    setDropdownOpen(false)
                    navigate({ to: '/admin' as '/' })
                  }}
                >
                  <ShieldCheck size={17} style={{ color: '#062A63' }} strokeWidth={1.8} />
                  <span
                    className="text-[13px]"
                    style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                  >
                    Panel Admin
                  </span>
                </button>
              )}
            </div>
          )}
      </div>
    </nav>
  )
}
