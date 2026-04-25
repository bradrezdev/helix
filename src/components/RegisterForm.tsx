import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Shuffle, X, Eye, EyeOff, Phone, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ── Country codes ─────────────────────────────────────────────────────────────
export const COUNTRIES = [
  { code: 'MX', name: 'México', dial: '52', flag: '🇲🇽' },
  { code: 'US', name: 'Estados Unidos', dial: '1', flag: '🇺🇸' },
  { code: 'CO', name: 'Colombia', dial: '57', flag: '🇨🇴' },
  { code: 'AR', name: 'Argentina', dial: '54', flag: '🇦🇷' },
  { code: 'PE', name: 'Perú', dial: '51', flag: '🇵🇪' },
  { code: 'CL', name: 'Chile', dial: '56', flag: '🇨🇱' },
  { code: 'ES', name: 'España', dial: '34', flag: '🇪🇸' },
  { code: 'GT', name: 'Guatemala', dial: '502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', dial: '504', flag: '🇭🇳' },
  { code: 'SV', name: 'El Salvador', dial: '503', flag: '🇸🇻' },
  { code: 'CR', name: 'Costa Rica', dial: '506', flag: '🇨🇷' },
  { code: 'PA', name: 'Panamá', dial: '507', flag: '🇵🇦' },
  { code: 'VE', name: 'Venezuela', dial: '58', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', dial: '593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', dial: '591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', dial: '595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', dial: '598', flag: '🇺🇾' },
]

// ── T&C ───────────────────────────────────────────────────────────────────────
export const TC_TEXT = `TÉRMINOS Y CONDICIONES — DISTRIBUIDOR INDEPENDIENTE ONANO GLOBAL

1. NATURALEZA DE LA RELACIÓN
El Distribuidor Independiente (en adelante "Distribuidor") es un empresario independiente y no empleado, agente, ni representante legal de ONANO Global. El Distribuidor es responsable de sus propios impuestos, gastos y obligaciones legales.

2. CÓDIGO DE ÉTICA
El Distribuidor se compromete a actuar con honestidad e integridad en todas sus actividades comerciales, a no realizar declaraciones falsas sobre los productos o el plan de compensación, y a respetar a todos los miembros de la red.

3. PLAN DE COMPENSACIÓN
Las comisiones y bonos se calculan de acuerdo al Plan de Compensación oficial vigente. ONANO Global se reserva el derecho de modificar el plan previa notificación. Las comisiones se abonan una vez completados los cierres de período correspondientes.

4. PRODUCTOS
El Distribuidor se compromete a comercializar los productos ONANO Global de acuerdo a las indicaciones y material oficial. Queda prohibida la venta a precios inferiores al precio sugerido al público.

5. RESCISIÓN
El incumplimiento de estos términos puede resultar en la cancelación de la cuenta sin derecho a compensación. El Distribuidor puede cancelar voluntariamente su cuenta en cualquier momento con un aviso de 30 días.

6. PRIVACIDAD
Los datos personales del Distribuidor serán tratados conforme a la Política de Privacidad de ONANO Global vigente.

Al activar tu cuenta, confirmas que has leído, entendido y aceptado todos los términos anteriores.`

// ── Helpers ───────────────────────────────────────────────────────────────────
export type SponsorStatus = 'idle' | 'loading' | 'found' | 'not_found'

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export function generateUsername(first: string, last: string) {
  const rand = Math.floor(Math.random() * 900) + 100
  return `${slugify(first)}${slugify(last)}${rand}`
}

export function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte']
  const colors = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981']
  return { score, label: labels[score] ?? '', color: colors[score] ?? '' }
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

// ── Shared style tokens ───────────────────────────────────────────────────────
export const inputBase = 'rounded-[18px] border border-[#EAECF0] px-4 py-3 text-sm outline-none transition-all w-full'
export const inputStyle = { borderColor: '#EAECF0', color: '#383A3F', fontFamily: 'Poppins, sans-serif' }

// ── Sub-components ────────────────────────────────────────────────────────────
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: 'rgba(56,58,63,0.6)', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Props for RegisterForm ────────────────────────────────────────────────────
export interface SponsorConfig {
  /** Pre-filled sponsor input value (e.g. from URL param or authenticated user) */
  prefillValue?: string
  /** When true, the sponsor field is read-only */
  locked?: boolean
  /** When provided as a resolved SponsorInfo, skip the lookup (RegisterByLinkPage mode) */
  resolved?: { id: string; user_id: number; name: string } | null
  /** Subtitle shown under ONANO logo */
  subtitle?: string
}

export interface RegisterFormProps {
  sponsor: SponsorConfig
  onSuccess: () => void
}

export function RegisterForm({ sponsor, onSuccess }: RegisterFormProps) {
  // ── Sponsor state ─────────────────────────────────────────────────────────
  const [sponsorInput, setSponsorInput] = useState(sponsor.prefillValue ?? '')
  const [sponsorId, setSponsorId] = useState<string | null>(sponsor.resolved?.id ?? null)
  const [sponsorName, setSponsorName] = useState<string | null>(sponsor.resolved?.name ?? null)
  const [sponsorStatus, setSponsorStatus] = useState<SponsorStatus>(
    sponsor.resolved ? 'found' : sponsor.prefillValue ? 'idle' : 'idle'
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState(COUNTRIES[0])
  const [countryOpen, setCountryOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showCPw, setShowCPw] = useState(false)
  const [tcAccepted, setTcAccepted] = useState(false)
  const [tcOpen, setTcOpen] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const pwStrength = passwordStrength(password)

  function suggestUsername() {
    if (firstName || lastName) setUsername(generateUsername(firstName, lastName))
  }

  async function lookupSponsor(value: string) {
    const trimmed = value.trim()
    if (!trimmed || isNaN(Number(trimmed))) {
      setSponsorStatus(trimmed ? 'not_found' : 'idle')
      setSponsorId(null); setSponsorName(null); return
    }
    setSponsorStatus('loading')
    const { data } = await supabase
      .from('users')
      .select('id, name, user_id')
      .eq('user_id', Number(trimmed))
      .single()
    if (data) {
      setSponsorId(data.id); setSponsorName(data.name); setSponsorStatus('found')
    } else {
      setSponsorId(null); setSponsorName(null); setSponsorStatus('not_found')
    }
  }

  // Initial lookup when prefillValue present and not already resolved
  useEffect(() => {
    if (sponsor.prefillValue && !sponsor.resolved) {
      lookupSponsor(sponsor.prefillValue)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced lookup for editable sponsor field
  useEffect(() => {
    if (sponsor.locked || sponsor.resolved) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!sponsorInput.trim()) { setSponsorStatus('idle'); setSponsorId(null); setSponsorName(null); return }
    debounceRef.current = setTimeout(() => lookupSponsor(sponsorInput), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [sponsorInput]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); setError(null)
    if (!isValidEmail(email)) { setError('Correo electrónico inválido'); return }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (pwStrength.score < 2) { setError('Contraseña débil — mínimo 8 chars, mayúscula y número'); return }
    if (sponsorStatus !== 'found') { setError('Ingresa un ID de patrocinador válido'); return }
    if (!tcAccepted) { setError('Acepta los términos y condiciones'); return }
    setSubmitting(true)
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`
      const resolvedSponsorId = sponsor.resolved ? String(sponsor.resolved.user_id) : sponsorId
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { name: fullName, username } },
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo crear el usuario')
      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        name: fullName,
        apellidos: lastName.trim(),
        email,
        membership: 'socio',
        sponsor_id: resolvedSponsorId,
        enrollment_date: new Date().toISOString().split('T')[0],
      })
      if (insertError) throw insertError
      onSuccess()
    } catch (err) {
      setError((err as Error)?.message ?? 'Error al registrarse')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Sponsor field ─────────────────────────────────────────────────────────
  const isLocked = sponsor.locked || !!sponsor.resolved
  const displaySponsorName = sponsor.resolved?.name ?? sponsorName
  const displaySponsorId = sponsor.resolved?.user_id != null
    ? String(sponsor.resolved.user_id)
    : sponsorInput

  function SponsorField() {
    return (
      <Field label="ID de Patrocinador">
        {isLocked ? (
          <div
            className="rounded-[18px] border px-4 py-3 flex items-center justify-between"
            style={{ borderColor: '#EAECF0', background: '#F9FAFB', fontFamily: 'Poppins, sans-serif' }}
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold" style={{ color: '#062A63' }}>
                {displaySponsorName ?? (sponsorInput ? 'Cargando...' : '—')}
              </span>
              {displaySponsorId && (
                <span className="text-[10px]" style={{ color: '#9CA3AF' }}>ID {displaySponsorId}</span>
              )}
            </div>
            <Lock size={14} style={{ color: '#0CBCE5' }} />
          </div>
        ) : (
          <>
            <input
              type="number" value={sponsorInput}
              onChange={e => setSponsorInput(e.target.value)}
              required placeholder="Ej. 1"
              className={inputBase} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#0CBCE5')}
              onBlur={e => (e.currentTarget.style.borderColor = '#EAECF0')}
            />
            {sponsorStatus === 'loading' && (
              <p className="text-[11px] flex items-center gap-1" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Buscando...
              </p>
            )}
            {sponsorStatus === 'found' && sponsorName && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full self-start"
                style={{ background: 'rgba(12,188,229,0.12)', color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}>
                X {sponsorName}
              </span>
            )}
            {sponsorStatus === 'not_found' && (
              <p className="text-[11px] px-2 py-1 rounded-lg" style={{ background: '#FEE2E2', color: '#DC2626', fontFamily: 'Poppins, sans-serif' }}>
                ID no encontrado
              </p>
            )}
          </>
        )}
      </Field>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        {/* ── Sponsor PRIMERO ── */}
        <SponsorField />

        {/* Nombre + Apellido */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre">
            <input
              type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
              required placeholder="Juan"
              className={inputBase} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#0CBCE5')}
              onBlur={e => (e.currentTarget.style.borderColor = '#EAECF0')}
            />
          </Field>
          <Field label="Apellidos">
            <input
              type="text" value={lastName} onChange={e => setLastName(e.target.value)}
              required placeholder="Pérez García"
              className={inputBase} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#0CBCE5')}
              onBlur={e => (e.currentTarget.style.borderColor = '#EAECF0')}
            />
          </Field>
        </div>

        {/* País */}
        <Field label="País">
          <div className="relative">
            <button
              type="button"
              onClick={() => setCountryOpen(v => !v)}
              className={`${inputBase} flex items-center justify-between`}
              style={inputStyle}
            >
              <span>{country.flag} {country.name}</span>
              <span style={{ color: '#9CA3AF', fontSize: 12 }}>▾</span>
            </button>
            {countryOpen && (
              <div
                className="absolute left-0 right-0 top-full mt-1 rounded-[18px] overflow-auto z-50 shadow-lg"
                style={{ background: '#fff', border: '1px solid #EAECF0', maxHeight: 220 }}
              >
                {COUNTRIES.map(c => (
                  <button key={c.code} type="button"
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50"
                    style={{ fontFamily: 'Poppins, sans-serif', color: '#383A3F' }}
                    onClick={() => { setCountry(c); setCountryOpen(false) }}
                  >
                    {c.flag} {c.name} (+{c.dial})
                  </button>
                ))}
              </div>
            )}
          </div>
        </Field>

        {/* Celular */}
        <Field label="Celular">
          <div className="flex gap-2">
            <div
              className="flex items-center px-3 rounded-[18px] border text-sm shrink-0"
              style={{ borderColor: '#EAECF0', color: '#6B7280', fontFamily: 'Poppins, sans-serif', background: '#F9FAFB' }}
            >
              <Phone size={13} className="mr-1.5" style={{ color: '#9CA3AF' }} />
              +{country.dial}
            </div>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              required placeholder="5512345678"
              className={inputBase} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#0CBCE5')}
              onBlur={e => (e.currentTarget.style.borderColor = '#EAECF0')}
            />
          </div>
        </Field>

        {/* Username */}
        <Field label="Nombre de usuario">
          <div className="flex gap-2">
            <input
              type="text" value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/g, ''))}
              required placeholder="juanperez123"
              className={inputBase} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#0CBCE5')}
              onBlur={e => (e.currentTarget.style.borderColor = '#EAECF0')}
            />
            <button
              type="button" onClick={suggestUsername} title="Sugerir usuario"
              className="w-12 rounded-[18px] flex items-center justify-center shrink-0 border active:scale-95 transition-transform"
              style={{ borderColor: '#EAECF0', background: '#F9FAFB' }}
            >
              <Shuffle size={15} style={{ color: '#062A63' }} />
            </button>
          </div>
          <p className="text-[10px]" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
            Solo letras minúsculas, números y guion bajo
          </p>
        </Field>

        {/* Email */}
        <Field label="Correo electrónico">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            required placeholder="tu@correo.com"
            className={inputBase} style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = '#0CBCE5')}
          />
          {emailTouched && email && !isValidEmail(email) && (
            <p className="text-[11px]" style={{ color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}>
              Correo no válido
            </p>
          )}
        </Field>

        {/* Contraseña */}
        <Field label="Contraseña">
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              required placeholder="••••••••" minLength={8}
              className={`${inputBase} pr-10`} style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = '#0CBCE5')}
              onBlur={e => (e.currentTarget.style.borderColor = '#EAECF0')}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2">
              {showPw
                ? <EyeOff size={15} style={{ color: '#9CA3AF' }} />
                : <Eye size={15} style={{ color: '#9CA3AF' }} />}
            </button>
          </div>
          {password && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 rounded-full" style={{ background: '#EAECF0' }}>
                <div className="h-1 rounded-full transition-all"
                  style={{ width: `${(pwStrength.score / 4) * 100}%`, background: pwStrength.color }} />
              </div>
              <span className="text-[10px] font-medium"
                style={{ color: pwStrength.color, fontFamily: 'Poppins, sans-serif' }}>
                {pwStrength.label}
              </span>
            </div>
          )}
          <p className="text-[10px]" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
            Mínimo 8 caracteres, una mayúscula, un número y un símbolo
          </p>
        </Field>

        {/* Confirmar contraseña */}
        <Field label="Confirmar contraseña">
          <div className="relative">
            <input
              type={showCPw ? 'text' : 'password'} value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required placeholder="••••••••"
              className={`${inputBase} pr-10`}
              style={{
                ...inputStyle,
                borderColor: confirmPassword && confirmPassword !== password ? '#EF4444' : '#EAECF0',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#0CBCE5')}
              onBlur={e => (e.currentTarget.style.borderColor = confirmPassword !== password ? '#EF4444' : '#EAECF0')}
            />
            <button type="button" onClick={() => setShowCPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2">
              {showCPw
                ? <EyeOff size={15} style={{ color: '#9CA3AF' }} />
                : <Eye size={15} style={{ color: '#9CA3AF' }} />}
            </button>
          </div>
          {confirmPassword && confirmPassword !== password && (
            <p className="text-[11px]" style={{ color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}>
              Las contraseñas no coinciden
            </p>
          )}
        </Field>

        {/* T&C */}
        <div className="flex items-start gap-3">
          <button
            type="button" onClick={() => setTcAccepted(v => !v)}
            className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all"
            style={{ borderColor: tcAccepted ? '#062A63' : '#D1D5DB', background: tcAccepted ? '#062A63' : 'transparent' }}
          >
            {tcAccepted && <span className="text-white text-[10px] font-bold">X</span>}
          </button>
          <p className="text-[12px] leading-relaxed" style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>
            Acepto los{' '}
            <button type="button" onClick={() => setTcOpen(true)}
              className="font-semibold underline" style={{ color: '#062A63' }}>
              Términos y Condiciones
            </button>{' '}
            de distribuidor independiente ONANO Global
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-[18px] px-4 py-2.5 text-xs"
            style={{ background: '#FEE2E2', color: '#DC2626', fontFamily: 'Poppins, sans-serif' }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || sponsorStatus !== 'found' || !tcAccepted}
          className="w-full rounded-full py-3.5 text-sm font-semibold text-white transition-all mt-1 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Registrando...
            </span>
          ) : 'Crear cuenta'}
        </button>
      </form>

      {/* T&C Bottom Sheet */}
      {tcOpen && (
        <>
          <div className="fixed inset-0 z-[2000]"
            style={{ background: 'rgba(6,42,99,0.25)', backdropFilter: 'blur(2px)' }}
            onClick={() => setTcOpen(false)} />
          <div
            className="fixed bottom-0 left-0 right-0 z-[2001] rounded-t-3xl flex flex-col"
            style={{ background: '#fff', maxHeight: '85dvh', boxShadow: '0 -8px 40px rgba(6,42,99,0.15)' }}
          >
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full" style={{ background: '#EAECF0' }} />
            </div>
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid #EAECF0' }}>
              <h3 className="font-semibold text-sm" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                Términos y Condiciones
              </h3>
              <button onClick={() => setTcOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full" style={{ background: '#F2F4F9' }}>
                <X size={14} style={{ color: '#9CA3AF' }} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <pre className="text-xs leading-relaxed whitespace-pre-wrap"
                style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>
                {TC_TEXT}
              </pre>
            </div>
            <div className="px-5 py-4"
              style={{ borderTop: '1px solid #EAECF0', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
              <button
                onClick={() => { setTcAccepted(true); setTcOpen(false) }}
                className="w-full py-3.5 rounded-full text-white font-semibold text-sm active:scale-[0.98] transition-transform"
                style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                Acepto los términos
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
