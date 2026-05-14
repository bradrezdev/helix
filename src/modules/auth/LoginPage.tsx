import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.ts'
import { useAuth } from './hooks/useAuth.ts'
import { useCart } from '../e-commerce/tienda/store.ts'

export function LoginPage() {
  const { signIn, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      useCart.getState().clear()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('membership')
          .eq('id', user.id)
          .maybeSingle()
        if (profile?.membership === 'socio_pendiente') {
          await navigate({ to: '/tienda' })
        } else {
          await navigate({ to: '/' })
        }
      } else {
        await navigate({ to: '/' })
      }
    } catch (err) {
      setError((err as Error)?.message ?? 'Error al iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  const isLoading = loading || submitting

  return (
    <div className="min-h-screen bg-[#F2F4F9] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <span
            className="text-3xl font-bold tracking-widest"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            ONANO
          </span>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
            Bienvenido de regreso
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-xs font-medium"
              style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
            >
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@correo.com"
              className="rounded-2xl border px-4 py-3 text-sm outline-none transition-all"
              style={{
                borderColor: '#EAECF0',
                color: '#383A3F',
                fontFamily: 'Poppins, sans-serif',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0CBCE5')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#EAECF0')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-xs font-medium"
              style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="rounded-2xl border px-4 py-3 text-sm outline-none transition-all"
              style={{
                borderColor: '#EAECF0',
                color: '#383A3F',
                fontFamily: 'Poppins, sans-serif',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#0CBCE5')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#EAECF0')}
            />
          </div>

          {error && (
            <p
              className="text-xs text-red-500 text-center"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full py-3 text-sm font-semibold text-white transition-all mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#062A63',
              fontFamily: 'Poppins, sans-serif',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#041e47'
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#062A63'
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              'Iniciar sesión'
            )}
          </button>
        </form>

        {/* Link to register */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
        >
          ¿No tienes cuenta?{' '}
          <Link
            to="/register"
            search={{ sponsor: undefined, locked: false }}
            className="font-medium"
            style={{ color: '#062A63' }}
          >
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  )
}
