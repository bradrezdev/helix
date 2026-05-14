import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'
import { supabase } from './supabase'
import DashboardLayout from '../layouts/DashboardLayout.tsx'
import ComisionesNivelPage from '../modules/finances/comisiones/ComisionesNivelPage.tsx'
import GananciasPage from '../modules/finances/ganancias/GananciasPage.tsx'
import BonoDetail from '../modules/finances/ganancias/components/BonoDetail.tsx'
import HistorialVolumenPage from '../modules/network/historial-volumen/HistorialVolumenPage.tsx'
import HoldingTankPage from '../modules/network/inscripciones/HoldingTankPage.tsx'
import { LoginPage } from '../modules/auth/LoginPage'
import { RegisterPage } from '../modules/auth/RegisterPage'
import { RegisterByLinkPage } from '../modules/auth/RegisterByLinkPage'
import { DashboardPage } from '../modules/network/dashboard/DashboardPage.tsx'
import { NetworkPage } from '../modules/network/genealogy'
import { NegocioPage } from '../modules/network/negocio/NegocioPage.tsx'
import { PedidosPage } from '../modules/e-commerce/pedidos/PedidosPage.tsx'
import { TiendaPage } from '../modules/e-commerce/tienda/TiendaPage.tsx'
import { CheckoutPage } from '../modules/e-commerce/tienda/CheckoutPage.tsx'
import { AddressesPage } from '../modules/e-commerce/tienda/AddressesPage.tsx'
import { PaymentMethodsPage } from '../modules/e-commerce/tienda/PaymentMethodsPage.tsx'
import { AdminPage } from '../modules/admin/AdminPage'
import { AdminOrdersPage } from '../modules/admin/AdminOrdersPage'
import { AdminGuard } from '../modules/admin/components/AdminGuard.tsx'
import { OrdenDetailPage } from '../modules/e-commerce/pedidos/OrdenDetailPage.tsx'
import { SimuladorPage } from '../modules/admin/simulador/SimuladorPage.tsx'
import { LtpPage } from '../modules/finances/awards/ltp/LtpPage.tsx'
import { RetirosPage } from '../modules/finances/retiros/RetirosPage.tsx'
import { BilleteraPage } from '../modules/finances/billetera/BilleteraPage.tsx'
import { SupportPage } from '../modules/support/SupportPage.tsx'

// Helper: check auth
async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw redirect({ to: '/login' })
  }
}

async function requireGuest() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    throw redirect({ to: '/' })
  }
}

/**
 * Check membership: redirect socio_pendiente/null to /tienda.
 * Run after requireAuth in authenticatedRoute.
 */
async function checkMembership({ location }: { location: { pathname: string } }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { data: profile, error } = await supabase
    .from('users')
    .select('membership, is_admin')
    .eq('id', session.user.id)
    .maybeSingle()
  // Guard: if query fails (e.g. RLS recursion), don't block navigation
  if (error || !profile) return
  // Admins bypass membership check — full access regardless of membership status
  if (profile?.is_admin) return
  if (
    (profile?.membership === 'socio_pendiente' || !profile?.membership) &&
    location.pathname !== '/tienda' &&
    !location.pathname.startsWith('/tienda') &&
    !location.pathname.startsWith('/registro/')
  ) {
    throw redirect({ to: '/tienda' })
  }
}

/** Block cliente_preferente from business routes. */
async function requireNotCP() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return
  const { data: profile, error } = await supabase
    .from('users')
    .select('membership')
    .eq('id', session.user.id)
    .maybeSingle()
  if (error || !profile) return
  if (profile?.membership === 'cliente_preferente') {
    throw redirect({ to: '/' })
  }
}

// ─── Root ─────────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: Outlet,
})

// ─── Public: Login ────────────────────────────────────────────────────────────

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  beforeLoad: requireGuest,
  component: LoginPage,
})

// /register — para usuario autenticado que registra a alguien (locked, sin leyenda patrocinador)
const registerRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/register',
  beforeLoad: requireNotCP,
  validateSearch: (search: Record<string, unknown>) => ({
    sponsor: search.sponsor ? String(search.sponsor) : undefined,
    locked: search.locked === 'true' || search.locked === true,
  }),
  component: RegisterPage,
})

// /registro/:username — link de referido público (locked, muestra leyenda "patrocinado por")
const registerByLinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/registro/$username',
  component: RegisterByLinkPage,
})

// ─── Protected layout wrapper ─────────────────────────────────────────────────

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  beforeLoad: async (ctx) => {
    await requireAuth()
    await checkMembership(ctx)
  },
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
})

// ─── Authenticated routes ─────────────────────────────────────────────────────

const dashboardRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/',
  component: DashboardPage,
})

const networkRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/red',
  component: NegocioPage,
})

const networkTreeRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/network',
  beforeLoad: requireNotCP,
  component: NetworkPage,
})

const ordenesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/ordenes',
  component: PedidosPage,
})

const ordenDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/ordenes/$orderId',
  component: OrdenDetailPage,
})

const tiendaRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/tienda',
  component: TiendaPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/checkout',
  component: CheckoutPage,
})

const paymentMethodsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/tienda/metodos-pago',
  component: PaymentMethodsPage,
})

const addressesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/tienda/direcciones',
  component: AddressesPage,
})

const adminRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/admin',
  component: () => (
    <AdminGuard>
      <AdminPage />
    </AdminGuard>
  ),
})

const adminOrdenesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/admin/ordenes',
  component: () => (
    <AdminGuard>
      <AdminOrdersPage />
    </AdminGuard>
  ),
})

const pedidosRedirectRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/pedidos',
  beforeLoad: () => { throw redirect({ to: '/ordenes' }) },
})

const simuladorRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/simulador',
  component: SimuladorPage,
})

const viajeRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/viaje',
  component: LtpPage,
})

const herramientasRedirectRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/herramientas',
  beforeLoad: () => { throw redirect({ to: '/viaje' }) },
})

const retirosRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/retiros',
  component: RetirosPage,
})

const billeteraRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/billetera',
  component: BilleteraPage,
})

const comisionesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/comisiones',
  beforeLoad: requireNotCP,
  component: () => <ComisionesNivelPage />,
})

const gananciasRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/ganancias',
  beforeLoad: requireNotCP,
  component: () => <GananciasPage />,
})

const gananciasBonoRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/ganancias/$bonoType',
  component: () => <BonoDetail />,
})

const historialVolumenRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/historial-volumen',
  component: () => <HistorialVolumenPage />,
})

const inscripcionesRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/inscripciones',
  beforeLoad: requireNotCP,
  component: HoldingTankPage,
})

const supportRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/soporte',
  component: SupportPage,
})

const routeTree = rootRoute.addChildren([
  loginRoute,
  registerByLinkRoute,
  authenticatedRoute.addChildren([
    dashboardRoute,
    networkRoute,
    networkTreeRoute,
    ordenesRoute,
    ordenDetailRoute,
    tiendaRoute,
    checkoutRoute,
    paymentMethodsRoute,
    addressesRoute,
    registerRoute,
    adminRoute,
    adminOrdenesRoute,
    pedidosRedirectRoute,
    simuladorRoute,
    viajeRoute,
    herramientasRedirectRoute,
    retirosRoute,
    billeteraRoute,
    comisionesRoute,
    gananciasRoute,
    gananciasBonoRoute,
    historialVolumenRoute,
    inscripcionesRoute,
    supportRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
