import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Categoria } from '../../../hooks/useStoreSections'
import { useAddProduct, useEditProduct } from '../../../hooks/useProductMutations'
import type { ProductFormData } from '../../../hooks/useProductMutations'
import type { Product } from '../../../hooks/useProducts'
import { ProductStatus, PRODUCT_STATUS_LABELS } from '../../../lib/formatters'

interface AddProductSheetProps {
  open: boolean
  onClose: () => void
  categorias: Categoria[]
  initialProduct?: Product | null
}

const PRICE_CURRENCIES = ['mxn', 'usd', 'cop', 'eur'] as const
const PRICE_TIERS = ['socio', 'public', 'promotor'] as const
const PRICE_TIER_LABELS: Record<string, string> = {
  socio: 'Socio',
  public: 'Público',
  promotor: 'Promotor',
}
const CURRENCY_LABELS: Record<string, string> = {
  mxn: 'MXN',
  usd: 'USD',
  cop: 'COP',
  eur: 'EUR',
}

function toInitialForm(product?: Product | null): ProductFormData {
  if (!product) {
    return {
      code: '',
      name: '',
      short_description: '',
      description: '',
      cantidad: '',
      pv: 0,
      cv: 0,
      stock: 0,
      image_url: '',
      categoria_id: '',
      product_status: ProductStatus.Disponible,
      launched_at: '',
      is_kit: false,
      kit_type: '',
      is_recommended: false,
      protected_password: '',
      activos: '',
      price_socio_mxn: undefined,
      price_public_mxn: undefined,
      price_promotor_mxn: undefined,
      price_socio_usd: undefined,
      price_public_usd: undefined,
      price_promotor_usd: undefined,
      price_socio_cop: undefined,
      price_public_cop: undefined,
      price_promotor_cop: undefined,
      price_socio_eur: undefined,
      price_public_eur: undefined,
      price_promotor_eur: undefined,
    }
  }
  return {
    code: product.code,
    name: product.name,
    short_description: product.short_description ?? '',
    description: product.description ?? '',
    cantidad: product.cantidad ?? '',
    pv: product.pv,
    cv: product.cv,
    stock: product.stock,
    image_url: product.image_url ?? '',
    categoria_id: product.categoria_id ?? '',
    product_status: product.product_status,
    launched_at: product.launched_at ? product.launched_at.slice(0, 10) : '',
    is_kit: product.is_kit,
    kit_type: product.kit_type ?? '',
    is_recommended: product.is_recommended,
    protected_password: product.protected_password ?? '',
    activos: product.activos ?? '',
    price_socio_mxn: product.price_socio_mxn ?? undefined,
    price_public_mxn: product.price_public_mxn ?? undefined,
    price_promotor_mxn: product.price_promotor_mxn ?? undefined,
    price_socio_usd: product.price_socio_usd ?? undefined,
    price_public_usd: product.price_public_usd ?? undefined,
    price_promotor_usd: product.price_promotor_usd ?? undefined,
    price_socio_cop: product.price_socio_cop ?? undefined,
    price_public_cop: product.price_public_cop ?? undefined,
    price_promotor_cop: product.price_promotor_cop ?? undefined,
    price_socio_eur: product.price_socio_eur ?? undefined,
    price_public_eur: product.price_public_eur ?? undefined,
    price_promotor_eur: product.price_promotor_eur ?? undefined,
  }
}

export function AddProductSheet({ open, onClose, categorias, initialProduct }: AddProductSheetProps) {
  const isEditing = !!initialProduct
  const addMutation = useAddProduct()
  const editMutation = useEditProduct()

  const [form, setForm] = useState<ProductFormData>(() => toInitialForm(initialProduct))
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (!open) return null

  function set<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {}
    if (!form.code.trim()) newErrors.code = 'Requerido'
    if (!form.name.trim()) newErrors.name = 'Requerido'
    if (form.pv < 0) newErrors.pv = 'Debe ser ≥ 0'
    if (form.cv < 0) newErrors.cv = 'Debe ser ≥ 0'
    if (form.stock < 0) newErrors.stock = 'Debe ser ≥ 0'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitError(null)

    try {
      const payload: ProductFormData = {
        ...form,
        launched_at: form.launched_at ? new Date(form.launched_at).toISOString() : undefined,
        kit_type: form.is_kit ? form.kit_type : undefined,
        protected_password: form.product_status === ProductStatus.Protegido ? form.protected_password : undefined,
        categoria_id: form.categoria_id || undefined,
      }

      if (isEditing) {
        await editMutation.mutateAsync({ code: initialProduct!.code, data: payload })
      } else {
        await addMutation.mutateAsync(payload)
      }
      onClose()
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const isPending = addMutation.isPending || editMutation.isPending

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[2000]"
        style={{ background: 'rgba(6,42,99,0.22)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Sheet — bottom on mobile, right panel on md+ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[2001] flex flex-col md:left-auto md:top-0 md:right-0 md:bottom-0 md:w-[480px]"
        style={{
          background: '#fff',
          borderRadius: '32px 32px 0 0',
          maxHeight: '95dvh',
          boxShadow: '0 -8px 40px rgba(6,42,99,0.14)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: '#EAECF0' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
          <h2
            className="text-[17px] font-semibold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            {isEditing ? 'Editar producto' : 'Agregar producto'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#F2F4F9' }}
          >
            <X size={16} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Form scroll area */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 flex flex-col gap-4">
          {/* Code */}
          <FormField label="Código" error={errors.code} required>
            <TextInput
              value={form.code}
              onChange={(v) => set('code', v)}
              placeholder="SKU-001"
              disabled={isEditing}
            />
          </FormField>

          {/* Name */}
          <FormField label="Nombre" error={errors.name} required>
            <TextInput value={form.name} onChange={(v) => set('name', v)} placeholder="Nombre del producto" />
          </FormField>

          {/* Short description */}
          <FormField label="Descripción corta">
            <textarea
              value={form.short_description ?? ''}
              onChange={(e) => set('short_description', e.target.value)}
              rows={2}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              style={{
                background: '#F2F4F9',
                color: '#383A3F',
                fontFamily: 'Poppins, sans-serif',
                border: '1.5px solid transparent',
              }}
              placeholder="Descripción breve"
            />
          </FormField>

          {/* Description */}
          <FormField label="Descripción larga">
            <textarea
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none resize-none"
              style={{
                background: '#F2F4F9',
                color: '#383A3F',
                fontFamily: 'Poppins, sans-serif',
                border: '1.5px solid transparent',
              }}
              placeholder="Descripción detallada"
            />
          </FormField>

          {/* Cantidad */}
          <FormField label="Cantidad / Contenido">
            <TextInput
              value={form.cantidad ?? ''}
              onChange={(v) => set('cantidad', v)}
              placeholder="500ml, 30 caps..."
            />
          </FormField>

          {/* PV / CV / Stock in a row */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label="PV" error={errors.pv}>
              <NumberInput value={form.pv} onChange={(v) => set('pv', v)} />
            </FormField>
            <FormField label="CV" error={errors.cv}>
              <NumberInput value={form.cv} onChange={(v) => set('cv', v)} />
            </FormField>
            <FormField label="Stock" error={errors.stock}>
              <NumberInput value={form.stock} onChange={(v) => set('stock', v)} />
            </FormField>
          </div>

          {/* Image URL */}
          <FormField label="URL de imagen">
            <TextInput
              value={form.image_url ?? ''}
              onChange={(v) => set('image_url', v)}
              placeholder="https://..."
            />
          </FormField>

          {/* Categoria */}
          <FormField label="Categoría">
            <select
              value={form.categoria_id ?? ''}
              onChange={(e) => set('categoria_id', e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
              style={{
                background: '#F2F4F9',
                color: form.categoria_id ? '#383A3F' : '#9CA3AF',
                fontFamily: 'Poppins, sans-serif',
                border: '1.5px solid transparent',
              }}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </FormField>

          {/* Product status */}
          <FormField label="Estado">
            <select
              value={form.product_status}
              onChange={(e) => set('product_status', e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
              style={{
                background: '#F2F4F9',
                color: '#383A3F',
                fontFamily: 'Poppins, sans-serif',
                border: '1.5px solid transparent',
              }}
            >
              {Object.values(ProductStatus).map((s) => (
                <option key={s} value={s}>
                  {PRODUCT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </FormField>

          {/* Protected password (shown only if protegido) */}
          {form.product_status === ProductStatus.Protegido && (
            <FormField label="Contraseña de acceso">
              <TextInput
                value={form.protected_password ?? ''}
                onChange={(v) => set('protected_password', v)}
                placeholder="Contraseña"
              />
            </FormField>
          )}

          {/* Launched at */}
          <FormField label="Fecha de lanzamiento">
            <input
              type="date"
              value={form.launched_at ?? ''}
              onChange={(e) => set('launched_at', e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
              style={{
                background: '#F2F4F9',
                color: '#383A3F',
                fontFamily: 'Poppins, sans-serif',
                border: '1.5px solid transparent',
              }}
            />
          </FormField>

          {/* Checkboxes */}
          <div className="flex flex-col gap-3">
            <CheckboxField
              label="Es un kit"
              checked={form.is_kit}
              onChange={(v) => set('is_kit', v)}
            />
            {form.is_kit && (
              <FormField label="Tipo de kit">
                <TextInput
                  value={form.kit_type ?? ''}
                  onChange={(v) => set('kit_type', v)}
                  placeholder="Tipo de kit"
                />
              </FormField>
            )}
            <CheckboxField
              label="Recomendado"
              checked={form.is_recommended}
              onChange={(v) => set('is_recommended', v)}
            />
          </div>

          {/* Prices */}
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
            >
              Precios
            </p>
            {PRICE_CURRENCIES.map((currency) => (
              <div key={currency} className="mb-4">
                <p
                  className="text-xs font-semibold mb-2"
                  style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
                >
                  {CURRENCY_LABELS[currency]}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {PRICE_TIERS.map((tier) => {
                    const key = `price_${tier}_${currency}` as keyof ProductFormData
                    return (
                      <FormField key={key} label={PRICE_TIER_LABELS[tier]}>
                        <NumberInput
                          value={(form[key] as number | undefined) ?? 0}
                          onChange={(v) => set(key, v as ProductFormData[typeof key])}
                          decimal
                        />
                      </FormField>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-5 py-4"
          style={{ borderTop: '1px solid #F2F4F9' }}
        >
          {submitError && (
            <p
              className="text-xs mb-3 text-center"
              style={{ color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}
            >
              {submitError}
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full py-4 rounded-full font-semibold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-transform"
            style={{ background: '#062A63', color: '#fff', fontFamily: 'Poppins, sans-serif' }}
          >
            {isPending && <Loader2 size={16} color="#fff" className="animate-spin" />}
            {isEditing ? 'Guardar cambios' : 'Guardar'}
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

// ── Shared primitives ─────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

function FormField({ label, error, required, children }: FormFieldProps) {
  return (
    <div>
      <p
        className="text-xs font-medium mb-1"
        style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
        {required && <span style={{ color: '#EF4444' }}> *</span>}
      </p>
      {children}
      {error && (
        <p
          className="text-[11px] mt-1"
          style={{ color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-2xl px-4 py-3 text-sm outline-none disabled:opacity-60"
      style={{
        background: '#F2F4F9',
        color: '#383A3F',
        fontFamily: 'Poppins, sans-serif',
        border: '1.5px solid transparent',
      }}
    />
  )
}

function NumberInput({
  value,
  onChange,
  decimal,
}: {
  value: number
  onChange: (v: number) => void
  decimal?: boolean
}) {
  return (
    <input
      type="number"
      step={decimal ? '0.01' : '1'}
      value={value}
      onChange={(e) => onChange(decimal ? parseFloat(e.target.value) || 0 : parseInt(e.target.value, 10) || 0)}
      className="w-full rounded-2xl px-3 py-3 text-sm outline-none"
      style={{
        background: '#F2F4F9',
        color: '#383A3F',
        fontFamily: 'Poppins, sans-serif',
        border: '1.5px solid transparent',
      }}
    />
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
        style={{
          background: checked ? '#062A63' : '#F2F4F9',
          border: checked ? 'none' : '1.5px solid #D1D5DB',
        }}
        onClick={() => onChange(!checked)}
      >
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4L4 7.5L10 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span
        className="text-sm"
        style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
      >
        {label}
      </span>
    </label>
  )
}
