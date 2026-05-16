import { useLocation } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Building2,
  Network,
  BarChart3,
  UserPlus,
  UserPlus2,
  Wallet,
  Plane,
  Calculator,
  ShieldCheck,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  DollarSign,
  Store,
  ShoppingCart,
  Package,
  CreditCard,
  MapPin,
  HelpCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../modules/auth/hooks/useAuth.ts'
import { useProfile } from '../modules/auth/hooks/useProfile.ts'
import { useLayoutStore } from './store.ts'
import { useIsDesktop } from '../hooks/useMediaQuery'
import { useNavigateWithTransition } from '../hooks/useNavigateWithTransition'

// ─── Internal Types ────────────────────────────────────────────────────────────

interface SidebarMenuItemProps {
  icon: LucideIcon
  label: string
  to: string
  indent?: boolean
  collapsed?: boolean
}

interface SidebarMenuGroupProps {
  icon: LucideIcon
  label: string
  children: React.ReactNode
  collapsed?: boolean
  expanded: boolean
  onToggle: () => void
  childRoutes: string[]
}

// ─── SidebarMenuItem ───────────────────────────────────────────────────────────

function SidebarMenuItem({
  icon: Icon,
  label,
  to,
  indent = false,
  collapsed = false,
}: SidebarMenuItemProps) {
  const location = useLocation()
  const navigateWithTransition = useNavigateWithTransition()

  const isActive =
    location.pathname === to || (to !== '/' && location.pathname.startsWith(to))

  const handleClick = () => {
    navigateWithTransition({ to } as Parameters<typeof navigateWithTransition>[0])
  }

  return (
    <button
      onClick={handleClick}
      title={label}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-[14px] cursor-pointer transition-colors duration-150 w-full text-left',
        indent && !collapsed && 'pl-8',
        collapsed && 'justify-center',
      )}
      style={{
        backgroundColor: isActive ? 'rgba(6,42,99,0.08)' : 'transparent',
        color: isActive ? '#062A63' : '#383A3F',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <Icon
        size={collapsed && indent ? 16 : 18}
        style={{ color: isActive ? '#062A63' : '#9CA3AF' }}
        strokeWidth={isActive ? 2.2 : 1.8}
      />
      {!collapsed && (
        <span className="text-sm font-medium truncate">{label}</span>
      )}
    </button>
  )
}

// ─── SidebarMenuGroup ──────────────────────────────────────────────────────────

/**
 * Submenu child routes — used to detect whether the group is active
 * (any child route matches the current path).
 */
const NEGOCIO_CHILD_ROUTES = ['/network', '/historial-volumen', '/ganancias', '/comisiones', '/inscripciones']
const TIENDA_CHILD_ROUTES = ['/tienda', '/ordenes']

function SidebarMenuGroup({
  icon: Icon,
  label,
  children,
  collapsed = false,
  expanded,
  onToggle,
  childRoutes,
}: SidebarMenuGroupProps) {
  const location = useLocation()

  const isChildActive = childRoutes.some((route) =>
    location.pathname.startsWith(route),
  )
  const isOpen = expanded && !collapsed

  const handleToggle = () => {
    // Collapsed sidebar — clicking does nothing (user must expand first)
    if (collapsed) return
    onToggle()
  }

  return (
    <div>
      {/* Group header — click toggles submenu */}
      <button
        onClick={handleToggle}
        title={label}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-[14px] cursor-pointer transition-colors duration-150 w-full text-left',
          collapsed && 'justify-center',
        )}
        style={{
          backgroundColor: isChildActive ? 'rgba(6,42,99,0.08)' : 'transparent',
          color: isChildActive ? '#062A63' : '#383A3F',
          fontFamily: 'Poppins, sans-serif',
        }}
      >
        <Icon
          size={18}
          style={{ color: isChildActive ? '#062A63' : '#9CA3AF' }}
          strokeWidth={isChildActive ? 2.2 : 1.8}
        />
        {!collapsed && (
          <>
            <span className="flex-1 text-sm font-medium truncate">{label}</span>
            <ChevronDown
              size={14}
              className={cn(
                'transition-transform duration-200',
                isOpen && 'rotate-180',
              )}
              style={{ color: '#9CA3AF' }}
            />
          </>
        )}
      </button>

      {/* Submenu children — animate in/out */}
      {!collapsed && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            isOpen ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <div className="pt-1">{children}</div>
        </div>
      )}
    </div>
  )
}

// ─── Sidebar (main component) ──────────────────────────────────────────────────

export function Sidebar() {
  const isDesktop = useIsDesktop()

  // Mobile: not rendered (parent DashboardLayout controls visibility via CSS,
  // but self-check for safety)
  if (!isDesktop) return null

  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id ?? '')
  const { sidebarCollapsed, toggleSidebar, negocioExpanded, toggleNegocio, tiendaExpanded, toggleTienda } = useLayoutStore()

  // Construct "Nuevo registro" URL with sponsor query param
  const registerTo = profile?.user_id
    ? `/register?sponsor=${profile.user_id}&locked=true`
    : '/register?locked=true'

  const isBusinessAllowed = profile?.membership === 'socio'

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-40 bg-white border-r flex flex-col',
        'transition-all duration-200 ease-in-out',
      )}
      style={{
        width: sidebarCollapsed ? 68 : 240,
        borderColor: '#EAECF0',
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      {/* ── Header: Brand + collapse toggle ── */}
      <div
        className="flex items-center justify-between px-4 py-4 border-b shrink-0"
        style={{ borderColor: '#EAECF0' }}
      >
        {!sidebarCollapsed && (
          <span
            className="text-[#062A63] font-bold text-lg"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            ONANO
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-[14px] hover:bg-[rgba(6,42,99,0.04)] transition-colors duration-150',
            sidebarCollapsed && 'mx-auto',
          )}
          aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={18} style={{ color: '#383A3F' }} />
          ) : (
            <PanelLeftClose size={18} style={{ color: '#383A3F' }} />
          )}
        </button>
      </div>

      {/* ── Menu items ── */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {/* Dashboard */}
        <SidebarMenuItem
          icon={LayoutDashboard}
          label="Dashboard"
          to="/"
          collapsed={sidebarCollapsed}
        />

        {/* Negocio — dropdown group (hidden for Cliente Preferente) */}
        {isBusinessAllowed && (
          <SidebarMenuGroup
            icon={Building2}
            label="Negocio"
            collapsed={sidebarCollapsed}
            expanded={negocioExpanded}
            onToggle={toggleNegocio}
            childRoutes={NEGOCIO_CHILD_ROUTES}
          >
            <SidebarMenuItem
              icon={Network}
              label="Árbol Uninivel"
              to="/network"
              indent
              collapsed={sidebarCollapsed}
            />
            <SidebarMenuItem
              icon={TrendingUp}
              label="Historial de Volumen"
              to="/historial-volumen"
              indent
              collapsed={sidebarCollapsed}
            />
            <SidebarMenuItem
              icon={DollarSign}
              label="Ganancias por Bono"
              to="/ganancias"
              indent
              collapsed={sidebarCollapsed}
            />
            <SidebarMenuItem
              icon={BarChart3}
              label="Comisiones"
              to="/comisiones"
              indent
              collapsed={sidebarCollapsed}
            />
            <SidebarMenuItem
              icon={UserPlus}
              label="Inscripciones"
              to="/inscripciones"
              indent
              collapsed={sidebarCollapsed}
            />
          </SidebarMenuGroup>
        )}

        {/* Nuevo registro — solo para socios */}
        {isBusinessAllowed && (
          <SidebarMenuItem
            icon={UserPlus2}
            label="Nuevo registro"
            to={registerTo}
            collapsed={sidebarCollapsed}
          />
        )}

        {/* Tienda — dropdown group */}
        <SidebarMenuGroup
          icon={Store}
          label="Tienda"
          collapsed={sidebarCollapsed}
          expanded={tiendaExpanded}
          onToggle={toggleTienda}
          childRoutes={TIENDA_CHILD_ROUTES}
        >
          <SidebarMenuItem
            icon={ShoppingCart}
            label="Comprar productos"
            to="/tienda"
            indent
            collapsed={sidebarCollapsed}
          />
          <SidebarMenuItem
            icon={Package}
            label="Órdenes"
            to="/ordenes"
            indent
            collapsed={sidebarCollapsed}
          />
          <SidebarMenuItem
            icon={CreditCard}
            label="Métodos de pago"
            to="/tienda/metodos-pago"
            indent
            collapsed={sidebarCollapsed}
          />
          <SidebarMenuItem
            icon={MapPin}
            label="Direcciones de envío"
            to="/tienda/direcciones"
            indent
            collapsed={sidebarCollapsed}
          />
        </SidebarMenuGroup>

        {/* Billetera — solo socios */}
        {isBusinessAllowed && (
          <SidebarMenuItem
            icon={Wallet}
            label="Billetera"
            to="/billetera"
            collapsed={sidebarCollapsed}
          />
        )}

        {/* Viaje de Liderazgo — solo socios */}
        {isBusinessAllowed && (
          <SidebarMenuItem
            icon={Plane}
            label="Viaje de Liderazgo"
            to="/viaje"
            collapsed={sidebarCollapsed}
          />
        )}

        {/* Soporte */}
        <SidebarMenuItem
          icon={HelpCircle}
          label="Soporte"
          to="/soporte"
          collapsed={sidebarCollapsed}
        />

        {/* Simulador — solo socios */}
        {isBusinessAllowed && (
          <SidebarMenuItem
            icon={Calculator}
            label="Simulador"
            to="/simulador"
            collapsed={sidebarCollapsed}
          />
        )}

        {/* Admin — conditional: only rendered when profile confirms is_admin */}
        {profile?.is_admin && (
          <SidebarMenuItem
            icon={ShieldCheck}
            label="Administrador"
            to="/admin"
            collapsed={sidebarCollapsed}
          />
        )}
      </nav>

      {/* ── Footer: user info (hidden when collapsed or loading) ── */}
      {!sidebarCollapsed && profile && (
        <div
          className="px-4 py-3 border-t shrink-0"
          style={{ borderColor: '#EAECF0' }}
        >
          <p
            className="text-sm font-medium text-[#383A3F] truncate"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {profile.name}
          </p>
          <p
            className="text-xs text-[#9CA3AF]"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {profile.rank}
          </p>
        </div>
      )}

      {/* Loading skeleton for user footer */}
      {!sidebarCollapsed && profileLoading && (
        <div
          className="px-4 py-3 border-t shrink-0 space-y-1.5"
          style={{ borderColor: '#EAECF0' }}
        >
          <div className="h-4 w-28 rounded bg-gray-200 animate-pulse" />
          <div className="h-3 w-16 rounded bg-gray-200 animate-pulse" />
        </div>
      )}
    </aside>
  )
}
