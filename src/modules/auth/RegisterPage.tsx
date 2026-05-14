import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase.ts'
import { useAuth } from './hooks/useAuth.ts'
import { useProfile } from './hooks/useProfile.ts'
import { RegisterForm } from './components/RegisterForm.tsx'

export function RegisterPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { sponsor?: string; locked?: boolean }
  const { user, loading: authLoading } = useAuth()
  const { data: profile } = useProfile(user?.id ?? '')
  const [registered, setRegistered] = useState(false)
  const [sponsorName, setSponsorName] = useState<string | null>(null)

  const prefillSponsor = search?.sponsor ?? ''
  const isLocked = search?.locked === true

  // Resolve sponsor: from URL param, or from authenticated user's own ID when locked
  const resolvedPrefill = prefillSponsor || (isLocked && profile?.user_id ? String(profile.user_id) : '')
  const isAdminUser = profile?.is_admin === true

  // For public referrer link: fetch sponsor name from URL param for display
  useEffect(() => {
    if (prefillSponsor && !authLoading && !user) {
      supabase
        .from('users')
        .select('name, apellidos')
        .eq('user_id', Number(prefillSponsor))
        .maybeSingle()
        .then(({ data }) => {
          if (data) setSponsorName(`${data.name} ${data.apellidos}`)
        })
        .catch(() => {})
    }
  }, [prefillSponsor, authLoading, user])

  async function handleSuccess() {
    if (user) {
      // Authenticated user (admin/socio) — show success, keep session
      setRegistered(true)
    } else {
      // Public registration — redirect to tienda for membership purchase
      await navigate({ to: '/tienda' })
    }
  }

  // Build subtitle
  let subtitle = 'Crea tu cuenta de distribuidor'
  if (sponsorName) subtitle = `Patrocinado por ${sponsorName}`
  else if (isLocked && profile?.name) subtitle = `Siendo registrado por ${profile.name}`

  if (registered) {
    return (
      <div className="min-h-screen bg-[#F2F4F9] flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-7 text-center">
          <span className="text-3xl font-bold tracking-widest" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
            ONANO
          </span>
          <div className="mt-8 mb-6">
            <p className="text-lg font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
              ✅ Registro exitoso
            </p>
            <p className="text-sm mt-2" style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>
              {sponsorName
                ? 'Tu cuenta ha sido creada correctamente.'
                : 'El nuevo distribuidor fue registrado correctamente.'}
            </p>
          </div>
          {isAdminUser ? (
            <button
              onClick={() => navigate({ to: '/red' })}
              className="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Ver organización
            </button>
          ) : (
            <button
              onClick={() => navigate({ to: '/login' })}
              className="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
              style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F2F4F9] flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-[32px] shadow-[0_2px_12px rgba(6,42,99,0.07)] p-7">
        {/* Logo */}
        <div className="text-center mb-7">
          <span className="text-3xl font-bold tracking-widest" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
            ONANO
          </span>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
            {subtitle}
          </p>
        </div>

        <RegisterForm
          sponsor={{
            prefillValue: resolvedPrefill || undefined,
            locked: isLocked,
          }}
          onSuccess={handleSuccess}
          isAdmin={isAdminUser}
        />
      </div>
    </div>
  )
}
