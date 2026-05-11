import { useState, useEffect } from 'react'
import { X, MapPin, Check } from 'lucide-react'
import { useAuth } from '../../../auth/hooks/useAuth.ts'
import { useProfile } from '../../../auth/hooks/useProfile.ts'
import { saveDireccion } from '../hooks/useDirecciones.ts'
import { ShippingAddressForm, type ShippingAddress } from './ShippingAddressForm.tsx'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

function emptyAddress(defaultCountry: string): ShippingAddress {
  return {
    country: defaultCountry,
    full_name: '',
    street: '',
    colonia: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  }
}

export function NuevaDireccionSheet({ open, onClose, onSaved }: Props) {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? '')
  const defaultCountry = profile?.country ?? 'MX'

  const [form, setForm] = useState<ShippingAddress>(() => emptyAddress(defaultCountry))
  const [makeDefault, setMakeDefault] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(emptyAddress(defaultCountry))
      setMakeDefault(true)
      setError(null)
    }
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open, defaultCountry])

  async function handleSave() {
    if (!user) return
    const required: (keyof ShippingAddress)[] = [
      'full_name', 'street', 'city', 'state', 'zip', 'phone',
    ]
    const missing = required.filter((f) => !(form[f] ?? '').trim())
    if (missing.length > 0) {
      setError('Por favor completa todos los campos obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveDireccion(user.id, {
        nombre_completo: form.full_name,
        calle_numero: form.street,
        colonia: form.colonia ?? '',
        municipio: form.city,
        estado: form.state,
        codigo_postal: form.zip,
        pais: form.country,
        phone: form.phone,
      }, makeDefault)
      onSaved()
      onClose()
    } catch {
      setError('No se pudo guardar la dirección. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
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
        className="fixed left-0 right-0 bottom-0 z-[1001] flex flex-col"
        style={{
          background: '#ffffff',
          borderRadius: '32px 32px 0 0',
          maxHeight: '92dvh',
          animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <MapPin size={18} color="#062A63" strokeWidth={2} />
            <h2
              className="text-[17px] font-semibold"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Nueva dirección
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X size={16} color="#6B7280" />
          </button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-3">
          <ShippingAddressForm
            value={form}
            onChange={setForm}
            defaultCountry={defaultCountry}
          />

          {/* Make default checkbox */}
          <button
            type="button"
            onClick={() => setMakeDefault((p) => !p)}
            className="flex items-center gap-3 py-1"
          >
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
              style={{
                borderColor: makeDefault ? '#062A63' : '#D1D5DB',
                background: makeDefault ? '#062A63' : 'transparent',
              }}
            >
              {makeDefault && <Check size={11} color="#fff" strokeWidth={3} />}
            </div>
            <span
              className="text-sm"
              style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
            >
              Establecer como dirección predeterminada
            </span>
          </button>

          {error && (
            <p
              className="text-sm rounded-[18px] px-4 py-2"
              style={{
                background: 'rgba(239,68,68,0.08)',
                color: '#EF4444',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {error}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50 mt-2"
            style={{ background: '#062A63' }}
          >
            <span
              className="text-white font-semibold text-sm"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {saving ? 'Guardando...' : 'Guardar dirección'}
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
