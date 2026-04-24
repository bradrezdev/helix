import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useIsAdmin } from '../hooks/useAdmin'
import type { ReactNode } from 'react'

interface AdminGuardProps {
  children: ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { loading: authLoading } = useAuth()
  const { user } = useAuth()
  const { isLoading: profileLoading } = useProfile(user?.id ?? '')
  const isAdmin = useIsAdmin()

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F9]">
        <div
          className="w-10 h-10 rounded-full border-4 border-[#062A63]/20 border-t-[#062A63] animate-spin"
          aria-label="Cargando"
        />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F9] p-6">
        <div
          className="rounded-[32px] bg-white shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-8 max-w-sm w-full text-center"
          style={{ border: '1px solid #EAECF0' }}
        >
          <div className="text-4xl mb-4">🔒</div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            Acceso denegado
          </h2>
          <p
            className="text-sm"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          >
            No tienes permisos para acceder al panel de administración.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
