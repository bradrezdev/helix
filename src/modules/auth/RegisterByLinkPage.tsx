import { useState, useEffect } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase'
import { RegisterForm } from './components/RegisterForm.tsx'

interface SponsorInfo { id: string; user_id: number; name: string; apellidos: string | null }

export function RegisterByLinkPage() {
  const navigate = useNavigate()
  const { username } = useParams({ strict: false }) as { username: string }

  const [sponsor, setSponsor] = useState<SponsorInfo | null>(null)
  const [sponsorLoading, setSponsorLoading] = useState(true)
  const [sponsorNotFound, setSponsorNotFound] = useState(false)

  useEffect(() => {
    async function fetchSponsor() {
      setSponsorLoading(true)
      const { data } = await supabase
        .from('users')
        .select('id, user_id, name, apellidos, link_referido')
        .eq('link_referido', username)
        .single()
      if (data) {
        setSponsor({ id: data.id, user_id: data.user_id, name: data.name, apellidos: data.apellidos })
      } else {
        setSponsorNotFound(true)
      }
      setSponsorLoading(false)
    }
    fetchSponsor()
  }, [username])

  async function handleSuccess() {
    await navigate({ to: '/' })
  }

  // ── Loading / not found states ────────────────────────────────────────────
  if (sponsorLoading) {
    return (
      <div className="min-h-screen bg-[#F2F4F9] flex items-center justify-center">
        <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#062A63" strokeWidth="4" />
          <path className="opacity-75" fill="#062A63" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (sponsorNotFound) {
    return (
      <div className="min-h-screen bg-[#F2F4F9] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-2xl mb-2">[CARD]</p>
          <h2 className="font-bold text-lg mb-1" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
            Link no encontrado
          </h2>
          <p className="text-sm" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
            El link de referido no existe o expiró.
          </p>
        </div>
      </div>
    )
  }

  const sponsorFullName = [sponsor?.name, sponsor?.apellidos].filter(Boolean).join(' ')

  return (
    <div className="min-h-screen bg-[#F2F4F9] flex items-start justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-[32px] shadow-[0_2px_12px_rgba(6,42,99,0.07)] p-7">
        {/* Logo */}
        <div className="text-center mb-7">
          <span className="text-3xl font-bold tracking-widest" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
            ONANO
          </span>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
            Crea tu cuenta de distribuidor
          </p>
          {/* Sponsor banner */}
          <div
            className="mt-3 px-4 py-2 rounded-[18px] inline-flex items-center gap-2"
            style={{ background: 'rgba(6,42,99,0.06)' }}
          >
            <span className="text-xs font-medium" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
              Está siendo patrocinado por{' '}
              <span className="font-bold">{sponsorFullName}</span>
            </span>
          </div>
        </div>

        <RegisterForm
          sponsor={{
            resolved: sponsor
              ? { id: sponsor.id, user_id: sponsor.user_id, name: sponsorFullName }
              : null,
            locked: true,
          }}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  )
}
