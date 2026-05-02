import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'
import { supabase } from './supabase'
import DashboardLayout from '../components/DashboardLayout'
import ComisionesNivelPage from '../modules/comisiones/ComisionesNivelPage'
import GananciasPage from '../modules/ganancias/GananciasPage'
import BonoDetail from '../modules/ganancias/components/BonoDetail'
import HistorialVolumenPage from '../modules/historial-volumen/HistorialVolumenPage'
import HoldingTankPage from '../modules/inscripciones/HoldingTankPage'
import { LoginPage } from '../modules/auth/LoginPage'
import { RegisterPage } from '../modules/auth/RegisterPage'
import { RegisterByLinkPage } from '../modules/auth/RegisterByLinkPage'
import { DashboardPage } from '../modules/dashboard/DashboardPage'
import { NetworkPage } from '../modules/network'
import { NegocioPage } from '../modules/negocio/NegocioPage'
import { PedidosPage } from '../modules/pedidos/PedidosPage'
import { TiendaPage } from '../modules/tienda/TiendaPage'
import { CheckoutPage } from '../modules/tienda/CheckoutPage'
import { AddressesPage } from '../modules/tienda/AddressesPage'
import { PaymentMethodsPage } from '../modules/tienda/PaymentMethodsPage'
import { AdminPage } from '../modules/admin/AdminPage'
import { AdminOrdersPage } from '../modules/admin/AdminOrdersPage'
import { AdminGuard } from '../components/AdminGuard'
import { OrdenDetailPage } from '../modules/pedidos/OrdenDetailPage'
import { SimuladorPage } from '../modules/herramientas/SimuladorPage'
import { HerramientasPage } from '../modules/herramientas/HerramientasPage'
import { RetirosPage } from '../modules/retiros/RetirosPage'
import { BilleteraPage } from '../modules/billetera/BilleteraPage'

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
  beforeLoad: requireAuth,
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
  component: HerramientasPage,
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
  component: () => <ComisionesNivelPage />,
})

const gananciasRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/ganancias',
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
  component: () => <HoldingTankPage />,
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
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
