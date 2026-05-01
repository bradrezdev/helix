import { useEffect, useRef } from 'react'
import { LogOut, X, User, Users } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useProfile, useSponsor } from '../hooks/useProfile'
import { useNavigate } from '@tanstack/react-router'

interface ProfileSheetProps {
  open: boolean
  onClose: () => void
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide"
        style={{ fontFamily: 'Poppins, sans-serif' }}>
        {label}
      </span>
      <span className="text-[14px] text-[#383A3F] font-medium"
        style={{ fontFamily: 'Poppins, sans-serif' }}>
        {value || '—'}
      </span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[32px] border border-[#EAECF0] bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-[#EAECF0]">
        <Icon size={15} color="#062A63" strokeWidth={2} />
        <span className="text-[13px] font-semibold text-[#062A63]"
          style={{ fontFamily: 'Poppins, sans-serif' }}>
          {title}
        </span>
      </div>
      <div className="px-4 py-4 flex flex-col gap-4">
        {children}
      </div>
    </div>
  )
}

export function ProfileSheet({ open, onClose }: ProfileSheetProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const sheetRef = useRef<HTMLDivElement>(null)

  const { data: profile, isLoading: profileLoading } = useProfile(user?.id ?? '')
  const { data: sponsor, isLoading: sponsorLoading } = useSponsor(profile?.sponsor_id)

  // Trap scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleSignOut() {
    onClose()
    try {
      await signOut()
    } catch {
      // signOut failed (e.g. network error) — still navigate to login
      // for 403 (invalid session), useAuth already handles it silently
    }
    navigate({ to: '/login' })
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000]"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed left-0 right-0 bottom-0 z-[1001] flex flex-col"
        style={{
          background: '#ffffff',
          borderRadius: '24px 24px 0 0',
          maxHeight: '88dvh',
          animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4">
          <h2 className="text-[17px] font-semibold text-[#062A63]"
            style={{ fontFamily: 'Poppins, sans-serif' }}>
            Mi Perfil
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 flex flex-col gap-3"
          style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>

          {/* Personal details */}
          <SectionCard title="Detalles personales" icon={User}>
            {profileLoading ? (
              <span className="text-sm text-gray-400">Cargando...</span>
            ) : (
              <>
                {/* Stats row */}
                <div
                  className="flex items-center justify-around rounded-[24px] bg-[#F5F7FA] px-4 py-3 gap-2"
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide"
                      style={{ fontFamily: 'Poppins, sans-serif' }}>ID</span>
                    <span className="text-[14px] font-semibold text-[#062A63]"
                      style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {profile?.user_id ?? '—'}
                    </span>
                  </div>
                  <div className="w-px h-8 rounded-full bg-[#EAECF0]" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide"
                      style={{ fontFamily: 'Poppins, sans-serif' }}>Rango</span>
                    <span className="text-[14px] font-semibold text-[#062A63]"
                      style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {profile?.rank ?? '—'}
                    </span>
                  </div>
                  <div className="w-px h-8 rounded-full bg-[#EAECF0]" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wide"
                      style={{ fontFamily: 'Poppins, sans-serif' }}>Sponsor</span>
                    <span className="text-[14px] font-semibold text-[#062A63] max-w-[72px] truncate"
                      style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {profile?.sponsor_id ? 'X' : '—'}
                    </span>
                  </div>
                </div>
                <DetailRow label="Nombre" value={profile?.name ?? ''} />
                <DetailRow
                  label="Fecha de registro"
                  value={
                    profile?.enrollment_date
                      ? (() => {
                          const [y, m, d] = profile.enrollment_date.split('-').map(Number)
                          return new Date(y, m - 1, d).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })
                        })()
                      : ''
                  }
                />
              </>
            )}
          </SectionCard>

          {/* Sponsor details */}
          <SectionCard title="Detalles del Patrocinador" icon={Users}>
            {!profile?.sponsor_id ? (
              <span className="text-sm text-gray-400">Sin patrocinador</span>
            ) : sponsorLoading ? (
              <span className="text-sm text-gray-400">Cargando...</span>
            ) : (
              <>
                <DetailRow label="ID" value={sponsor?.user_id?.toString() ?? ''} />
                <DetailRow label="Nombre" value={sponsor?.name ?? ''} />
                <DetailRow label="Rango actual" value={sponsor?.rank ?? ''} />
                <DetailRow label="Contacto" value={sponsor?.email ?? ''} />
              </>
            )}
          </SectionCard>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border border-red-200 text-red-500 transition-colors active:bg-red-50"
          >
            <LogOut size={17} color="#EF4444" strokeWidth={2} />
            <span className="text-[14px] font-semibold text-red-500"
              style={{ fontFamily: 'Poppins, sans-serif' }}>
              Cerrar sesión
            </span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

// ─── UserBadge ────────────────────────────────────────────────────────────────

interface UserBadgeProps {
  name: string
  onClick: () => void
}

export function UserBadge({ name, onClick }: UserBadgeProps) {
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  const displayName = name?.split(' ')[0] ?? name

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#EAECF0] bg-white/80 active:bg-gray-50 transition-colors"
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #062A63 0%, #0CBCE5 100%)' }}
      >
        <span className="text-[12px] font-bold text-white"
          style={{ fontFamily: 'Poppins, sans-serif' }}>
          {initial}
        </span>
      </div>
      {/* Name */}
      <span className="text-[13px] font-medium text-[#383A3F] max-w-[100px] truncate"
        style={{ fontFamily: 'Poppins, sans-serif' }}>
        {displayName}
      </span>
    </button>
  )
}
