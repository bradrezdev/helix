import { useEffect, useState } from 'react'
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
  const { isLoading: profileLoading, error: profileError } = useProfile(user?.id ?? '')
  const isAdmin = useIsAdmin()
  const [timedOut, setTimedOut] = useState(false)

  const isLoading = authLoading || profileLoading

  useEffect(() => {
    if (!isLoading) return
    const timer = setTimeout(() => setTimedOut(true), 8000)
    return () => clearTimeout(timer)
  }, [isLoading])

  // Reset timeout flag if loading resolves
  useEffect(() => {
    if (!isLoading) setTimedOut(false)
  }, [isLoading])

  if (profileError || timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F4F9] p-6">
        <div
          className="rounded-[32px] bg-white shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-8 max-w-sm w-full text-center"
          style={{ border: '1px solid #EAECF0' }}
        >
          <div className="text-4xl mb-4">⚠️</div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            Error al cargar perfil
          </h2>
          <p
            className="text-sm mb-4"
            style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
          >
            Error al cargar perfil. Recarga la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-[32px] text-sm font-medium text-white"
            style={{ backgroundColor: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            Recargar
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
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
