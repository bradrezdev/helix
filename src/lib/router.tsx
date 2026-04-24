import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'
import { supabase } from './supabase'
import { Layout } from '../components/Layout'
import { LoginPage } from '../modules/auth/LoginPage'
import { RegisterPage } from '../modules/auth/RegisterPage'
import { RegisterByLinkPage } from '../modules/auth/RegisterByLinkPage'
import { DashboardPage } from '../modules/dashboard/DashboardPage'
import { NetworkPage } from '../modules/network'
import { NegocioPage } from '../modules/negocio/NegocioPage'
import { PedidosPage } from '../modules/pedidos/PedidosPage'
import { TiendaPage } from '../modules/tienda/TiendaPage'
import { CheckoutPage } from '../modules/tienda/CheckoutPage'
import { AdminPage } from '../modules/admin/AdminPage'
import { AdminGuard } from '../components/AdminGuard'
import { OrdenDetailPage } from '../modules/pedidos/OrdenDetailPage'

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
    <Layout>
      <Outlet />
    </Layout>
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

const adminRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/admin',
  component: () => (
    <AdminGuard>
      <AdminPage />
    </AdminGuard>
  ),
})

const pedidosRedirectRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/pedidos',
  beforeLoad: () => { throw redirect({ to: '/ordenes' }) },
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
    registerRoute,
    adminRoute,
    pedidosRedirectRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
