import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from './hooks/useAuth.ts'
import { useProfile } from './hooks/useProfile.ts'
import { RegisterForm } from './components/RegisterForm.tsx'

export function RegisterPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { sponsor?: string; locked?: boolean }
  const { user } = useAuth()
  const { data: profile } = useProfile(user?.id ?? '')
  const [registered, setRegistered] = useState(false)

  const prefillSponsor = search?.sponsor ?? ''
  const isLocked = search?.locked === true

  // When locked=true and no sponsor in URL, auto-fill with authenticated user's user_id
  const [resolvedPrefill, setResolvedPrefill] = useState(prefillSponsor)

  useEffect(() => {
    if (isLocked && !prefillSponsor && profile?.user_id) {
      setResolvedPrefill(String(profile.user_id))
    }
  }, [isLocked, prefillSponsor, profile?.user_id])

  const isAdminUser = profile?.is_admin === true

  async function handleSuccess() {
    if (isAdminUser) {
      setRegistered(true)
    } else {
      await navigate({ to: '/' })
    }
  }

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
              El nuevo distribuidor fue registrado correctamente.
            </p>
          </div>
          <button
            onClick={() => navigate({ to: '/red' })}
            className="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            Ver organización
          </button>
        </div>
      </div>
    )
  }

  const subtitle = isLocked && profile?.name
    ? `Siendo registrado por ${profile.name}`
    : 'Crea tu cuenta de distribuidor'

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
