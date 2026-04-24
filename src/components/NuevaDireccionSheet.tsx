import { useState, useEffect } from 'react'
import { X, MapPin, Check } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { saveDireccion, type NuevaDireccionData } from '../hooks/useDirecciones'

const ESTADOS_MEXICO = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
  'Zacatecas',
]

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const EMPTY: NuevaDireccionData = {
  nombre_completo: '',
  calle_numero: '',
  colonia: '',
  municipio: '',
  estado: '',
  codigo_postal: '',
}

export function NuevaDireccionSheet({ open, onClose, onSaved }: Props) {
  const { user } = useAuth()
  const [form, setForm] = useState<NuevaDireccionData>(EMPTY)
  const [makeDefault, setMakeDefault] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setMakeDefault(true)
      setError(null)
    }
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  function set(field: keyof NuevaDireccionData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave() {
    if (!user) return
    const required: (keyof NuevaDireccionData)[] = [
      'nombre_completo', 'calle_numero', 'colonia', 'municipio', 'estado', 'codigo_postal',
    ]
    const missing = required.filter((f) => !(form[f] ?? '').trim())
    if (missing.length > 0) {
      setError('Por favor completa todos los campos obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveDireccion(user.id, form, makeDefault)
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
        className="fixed inset-0 z-[10000]"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[10001] flex flex-col"
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
          <Field
            label="Nombre completo"
            placeholder="Ej. María García López"
            value={form.nombre_completo}
            onChange={(v) => set('nombre_completo', v)}
          />
          <Field
            label="Calle y número"
            placeholder="Ej. Insurgentes Sur 1234"
            value={form.calle_numero}
            onChange={(v) => set('calle_numero', v)}
          />
          <Field
            label="Colonia"
            placeholder="Ej. Del Valle"
            value={form.colonia}
            onChange={(v) => set('colonia', v)}
          />
          <Field
            label="Municipio / Alcaldía"
            placeholder="Ej. Benito Juárez"
            value={form.municipio}
            onChange={(v) => set('municipio', v)}
          />

          {/* Estado dropdown */}
          <div className="flex flex-col gap-1">
            <label
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'rgba(56,58,63,0.6)', fontFamily: 'Poppins, sans-serif' }}
            >
              Estado
            </label>
            <select
              value={form.estado}
              onChange={(e) => set('estado', e.target.value)}
              className="w-full px-4 py-3 rounded-[18px] border border-[#EAECF0] text-sm appearance-none"
              style={{
                color: form.estado ? '#383A3F' : '#9CA3AF',
                fontFamily: 'Poppins, sans-serif',
                background: '#fff',
              }}
            >
              <option value="" disabled>Selecciona un estado</option>
              {ESTADOS_MEXICO.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <Field
            label="Código postal"
            placeholder="Ej. 03100"
            value={form.codigo_postal}
            onChange={(v) => set('codigo_postal', v)}
            inputMode="numeric"
            maxLength={5}
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

interface FieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode']
  maxLength?: number
}

function Field({ label, placeholder, value, onChange, inputMode, maxLength }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: 'rgba(56,58,63,0.6)', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        maxLength={maxLength}
        className="w-full px-4 py-3 rounded-[18px] border border-[#EAECF0] text-sm outline-none focus:border-[#062A63] transition-colors"
        style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
      />
    </div>
  )
}
