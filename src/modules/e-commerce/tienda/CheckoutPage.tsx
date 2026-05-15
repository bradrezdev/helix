import { useState } from 'react'
import { ArrowLeft, Wallet, CreditCard, CheckCircle2, Loader2, MapPin, Home, Building2, ChevronRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useCart } from './store.ts'
import { useAuth } from '../../auth/hooks/useAuth.ts'
import { useProfile } from '../../auth/hooks/useProfile.ts'
import { useTaxRate } from './hooks/useTaxRate.ts'
import { supabase } from '../../../lib/supabase.ts'
import { useDefaultDireccion, setDefaultDireccion } from './hooks/useDirecciones.ts'
import { useWallet } from '../../finances/billetera/hooks/useWallet.ts'
import type { Direccion } from './hooks/useDirecciones.ts'
import type { Cedi } from './hooks/useCedis.ts'
import { NuevaDireccionSheet } from './components/NuevaDireccionSheet.tsx'
import { CediSelectorSheet } from './components/CediSelectorSheet.tsx'
import { getProductPrice, getCountryCurrency } from './utils/pricing.ts'

type Step = 'review' | 'payment' | 'confirm'
type PaymentMethod = 'wallet' | 'card'
type ShippingOption = 'nueva' | 'default' | 'cedi' | null

interface OrderResult {
  order_id: string
  order_code: string
  status: string
  membership_upgraded?: boolean
  process_verified?: boolean
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { items, total, totalPV, clear } = useCart()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? '')
  const country: string = getCountryCurrency(profile?.country ?? 'MX')
  const membership: string = profile?.membership ?? 'socio'
  const { rate: taxRate, label: taxLabel } = useTaxRate(country)
  const { walletsByType } = useWallet(user?.id ?? null)
  const mxnWallet = walletsByType.disponible?.find((w: { currency: string }) => w.currency === 'MXN')
  const walletBalance = mxnWallet?.balance ?? 0

  const [step, setStep] = useState<Step>('review')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null)

  // Shipping state
  const [shippingOption, setShippingOption] = useState<ShippingOption>(null)
  const [showNuevaDireccion, setShowNuevaDireccion] = useState(false)
  const [showCediSelector, setShowCediSelector] = useState(false)
  const [showDireccionPicker, setShowDireccionPicker] = useState(false)
  const [selectedCedi, setSelectedCedi] = useState<Cedi | null>(null)

  const { defaultDireccion, loading: dirLoading, refetch, direcciones } = useDefaultDireccion()

  const cartTotal = total()
  const cartPV = totalPV()
  const taxAmount = cartTotal * taxRate
  const grandTotal = cartTotal + taxAmount

  // Physical products need shipping; membership is virtual
  const hasPhysicalProducts = items.some((item) => {
    if (item.product.kit_type === 'membresia') return false
    return true
  })

  async function handleConfirmPayment() {
    if (!user) return

    // Shipping guard — only required for physical products
    if (hasPhysicalProducts) {
      if (!shippingOption) {
        setError('Selecciona una opción de envío')
        return
      }
      if (shippingOption === 'cedi' && !selectedCedi) {
        setError('Selecciona un CEDI')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const payload = items.map((i) => ({
        product_code: i.product.code,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_price: getProductPrice(i.product, country, membership),
        pv: i.product.pv,
        cv: i.product.cv,
      }))

      const shippingData = shippingOption === 'cedi' && selectedCedi
        ? { type: 'cedi', cedi_id: selectedCedi.id, cedi_nombre: selectedCedi.nombre }
        : shippingOption === 'default' && defaultDireccion
          ? { type: 'domicilio', direccion_id: defaultDireccion.id }
          : null

      const { data, error: rpcError } = await supabase.rpc('place_order_with_membership', {
        p_user_id: user.id,
        p_items: payload,
        p_total_amount: grandTotal,
        p_payment_method: paymentMethod,
        p_payment_ref: '',
        p_shipping_data: shippingData,
        p_tax_amount: taxAmount,
        p_with_membership: true,
      })

      if (rpcError) throw rpcError

      setOrderResult(data as unknown as OrderResult)
      clear()
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      queryClient.invalidateQueries({ queryKey: ['kit-eligibility', user.id] })
      setStep('confirm')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('insufficient_wallet_balance')) {
        setError('Saldo insuficiente en tu billetera virtual.')
      } else {
        setError('Ocurrió un error al procesar tu orden. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0 && step !== 'confirm') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{ background: '#F2F4F9' }}>
        <p style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }} className="text-sm mb-4">
          No hay productos en el carrito
        </p>
        <button
          onClick={() => navigate({ to: '/tienda' })}
          className="text-sm font-semibold"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Ir a la tienda
        </button>
      </main>
    )
  }

  // ── Confirm screen ─────────────────────────────────────────────────────────
  if (step === 'confirm' && orderResult) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#F2F4F9', paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}
      >
        <CheckCircle2 size={72} style={{ color: '#10B981' }} strokeWidth={1.5} />
        <h2
          className="text-2xl font-bold mt-5 mb-2"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          ¡Orden confirmada!
        </h2>
        <p className="text-sm mb-1" style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>
          Orden #{orderResult.order_code ?? orderResult.order_id}
        </p>
        <p className="text-xs mb-8" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
          Estado: {orderResult.status === 'paid' ? 'Pagado X' : 'Pendiente'}
        </p>
        <button
          onClick={() => navigate({ to: '/ordenes' })}
          className="w-full py-4 rounded-full text-white font-semibold"
          style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Ver mis órdenes
        </button>
        <button
          onClick={() => navigate({ to: '/tienda' })}
          className="mt-3 text-sm"
          style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
        >
          Seguir comprando
        </button>
      </main>
    )
  }

  // ── Review + Payment ───────────────────────────────────────────────────────
  return (
    <>
      <main
        className="min-h-screen px-4 pt-8"
        style={{ background: '#F2F4F9', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate({ to: '/tienda' })}
            className="w-9 h-9 flex items-center justify-center rounded-full"
            style={{ background: '#fff', boxShadow: '0 1px 4px rgba(6,42,99,0.08)' }}
          >
            <ArrowLeft size={18} style={{ color: '#062A63' }} />
          </button>
          <h1
            className="text-xl font-bold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            Checkout
          </h1>
        </div>

        {/* Order summary */}
        <div
          className="rounded-[32px] p-4 mb-4"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(6,42,99,0.07)' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
          >
            Resumen
          </p>
          <div className="flex flex-col gap-2">
            {items.map(({ product, quantity }) => (
              <div key={product.code} className="flex justify-between items-center">
                <span className="text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                  {product.name} × {quantity}
                </span>
                <span className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                  {(getProductPrice(product, country, membership) * quantity).toLocaleString('es-MX', { minimumFractionDigits: 2, style: 'currency', currency: country === 'USD' ? 'USD' : country === 'EUR' ? 'EUR' : country === 'COP' ? 'COP' : 'MXN' })}
                </span>
              </div>
            ))}
          </div>
          <div
            className="flex justify-between items-center mt-3 pt-3"
            style={{ borderTop: '1px solid #EAECF0' }}
          >
            <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
              Subtotal
            </span>
            <span className="text-sm" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
              ${cartTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {country}
            </span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
                {taxLabel} ({(taxRate * 100).toFixed(0)}%)
              </span>
              <span className="text-sm" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                ${taxAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {country}
              </span>
            </div>
          )}
          <div
            className="flex justify-between items-center mt-2 pt-2"
            style={{ borderTop: '1px solid #EAECF0' }}
          >
            <span className="text-sm font-bold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
              Total · {cartPV.toFixed(0)} PV
            </span>
            <span className="text-lg font-bold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
              ${grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {country}
            </span>
          </div>
        </div>

        {/* ── ENVÍO section — only for physical products ── */}
        {hasPhysicalProducts && (
          <div
            className="rounded-[32px] p-4 mb-4"
            style={{ background: '#fff', boxShadow: '0 2px 12px rgba(6,42,99,0.07)' }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide mb-3"
              style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
            >
              Envío
            </p>
            <div className="flex flex-col gap-2">

              {/* Option A — Nueva dirección */}
              <ShippingCard
                selected={shippingOption === 'nueva'}
                onSelect={() => setShippingOption('nueva')}
                icon={<MapPin size={20} style={{ color: '#062A63' }} />}
                title="Añadir nueva dirección"
                subtitle="Ingresa una nueva dirección de entrega"
                action={
                  shippingOption === 'nueva' ? (
                    <button
                      onClick={() => setShowNuevaDireccion(true)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: '#062A63', color: '#fff', fontFamily: 'Poppins, sans-serif' }}
                    >
                      Configurar
                      <ChevronRight size={13} color="#fff" />
                    </button>
                  ) : null
                }
              />

              {/* Option B — Dirección predeterminada */}
              <ShippingCard
                selected={shippingOption === 'default'}
                onSelect={() => setShippingOption('default')}
                icon={<Home size={20} style={{ color: '#062A63' }} />}
                title="Dirección predeterminada"
                subtitle={
                  dirLoading
                    ? 'Cargando...'
                    : defaultDireccion
                      ? `${defaultDireccion.nombre_completo} · ${defaultDireccion.calle_numero}, ${defaultDireccion.colonia}, ${defaultDireccion.municipio}, ${defaultDireccion.estado} CP ${defaultDireccion.codigo_postal}`
                      : 'Sin dirección predeterminada — añade una'
                }
                subtitleColor={!dirLoading && !defaultDireccion ? '#9CA3AF' : undefined}
                action={
                  shippingOption === 'default' && !dirLoading ? (
                    <button
                      onClick={() => setShowDireccionPicker(true)}
                      className="text-xs font-semibold"
                      style={{ color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}
                    >
                      Cambiar
                    </button>
                  ) : null
                }
              />

              {/* Option C — Recoger en CEDI */}
              <ShippingCard
                selected={shippingOption === 'cedi'}
                onSelect={() => setShippingOption('cedi')}
                icon={<Building2 size={20} style={{ color: '#062A63' }} />}
                title="Recoger en CEDI"
                subtitle={
                  selectedCedi
                    ? `${selectedCedi.nombre} · ${selectedCedi.municipio}, ${selectedCedi.estado}`
                    : 'Recoge tu pedido en nuestro centro de distribución'
                }
                action={
                  shippingOption === 'cedi' ? (
                    <button
                      onClick={() => setShowCediSelector(true)}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ background: '#062A63', color: '#fff', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {selectedCedi ? 'Cambiar' : 'Seleccionar CEDI'}
                      <ChevronRight size={13} color="#fff" />
                    </button>
                  ) : null
                }
              />
            </div>
          </div>
        )}

        {/* Payment method */}
        <div
          className="rounded-[32px] p-4 mb-6"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(6,42,99,0.07)' }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
          >
            Método de pago
          </p>

          {/* Wallet option */}
          <button
            onClick={() => setPaymentMethod('wallet')}
            className="w-full flex items-center gap-3 p-4 rounded-[32px] mb-3 transition-all"
            style={{
              background: paymentMethod === 'wallet' ? 'rgba(6,42,99,0.04)' : '#F8FAFF',
              border: paymentMethod === 'wallet' ? '2px solid #062A63' : '2px solid transparent',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(6,42,99,0.08)' }}
            >
              <Wallet size={20} style={{ color: '#062A63' }} />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                Billetera virtual
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
                Saldo: {walletBalance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
              </p>
            </div>
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: paymentMethod === 'wallet' ? '#062A63' : '#D1D5DB',
              }}
            >
              {paymentMethod === 'wallet' && (
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#062A63' }} />
              )}
            </div>
          </button>

          {/* Card option */}
          <button
            onClick={() => setPaymentMethod('card')}
            className="w-full flex items-center gap-3 p-4 rounded-[32px] transition-all"
            style={{
              background: paymentMethod === 'card' ? 'rgba(6,42,99,0.04)' : '#F8FAFF',
              border: paymentMethod === 'card' ? '2px solid #062A63' : '2px solid transparent',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(6,42,99,0.08)' }}
            >
              <CreditCard size={20} style={{ color: '#062A63' }} />
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                Tarjeta
              </p>
              <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
                Próximamente — Stripe / MercadoPago
              </p>
            </div>
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: paymentMethod === 'card' ? '#062A63' : '#D1D5DB',
              }}
            >
              {paymentMethod === 'card' && (
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#062A63' }} />
              )}
            </div>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-[32px] px-4 py-3 mb-4 text-sm"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}
          >
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleConfirmPayment}
          disabled={loading || paymentMethod === 'card'}
          className="w-full py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
          style={{ background: '#062A63' }}
        >
          {loading
            ? <Loader2 size={20} color="#fff" className="animate-spin" />
            : (
              <span className="text-white font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {paymentMethod === 'card' ? 'Pronto disponible' : 'Confirmar y pagar'}
              </span>
            )}
        </button>
      </main>

      {/* Sheets */}
      <NuevaDireccionSheet
        open={showNuevaDireccion}
        onClose={() => setShowNuevaDireccion(false)}
        onSaved={() => {
          refetch()
          setShippingOption('default')
        }}
      />

      <CediSelectorSheet
        open={showCediSelector}
        onClose={() => setShowCediSelector(false)}
        onSelect={(cedi) => setSelectedCedi(cedi)}
      />

      {/* Direccion picker bottom sheet */}
      <DireccionPickerSheet
        open={showDireccionPicker}
        onClose={() => setShowDireccionPicker(false)}
        direcciones={direcciones}
        currentDefaultId={defaultDireccion?.id ?? null}
        onPick={async (id) => {
          if (user) {
            await setDefaultDireccion(user.id, id)
            await refetch()
          }
          setShowDireccionPicker(false)
        }}
      />
    </>
  )
}

// ── ShippingCard ──────────────────────────────────────────────────────────────

interface ShippingCardProps {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
  subtitleColor?: string
  action?: React.ReactNode
}

function ShippingCard({ selected, onSelect, icon, title, subtitle, subtitleColor, action }: ShippingCardProps) {
  return (
    <div
      className="rounded-[32px] p-4 transition-all"
      style={{
        background: selected ? 'rgba(6,42,99,0.03)' : '#F8FAFF',
        border: selected ? '2px solid #062A63' : '2px solid transparent',
      }}
    >
      <button className="w-full flex items-center gap-3" onClick={onSelect}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(6,42,99,0.08)' }}
        >
          {icon}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
            {title}
          </p>
          <p
            className="text-xs mt-0.5 leading-snug"
            style={{ color: subtitleColor ?? '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
          >
            {subtitle}
          </p>
        </div>
        <div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
          style={{ borderColor: selected ? '#062A63' : '#D1D5DB' }}
        >
          {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#062A63' }} />}
        </div>
      </button>
      {action && <div className="mt-3 flex justify-end">{action}</div>}
    </div>
  )
}

// ── DireccionPickerSheet ──────────────────────────────────────────────────────

interface DireccionPickerSheetProps {
  open: boolean
  onClose: () => void
  direcciones: Direccion[]
  currentDefaultId: string | null
  onPick: (id: string) => Promise<void>
}

function DireccionPickerSheet({ open, onClose, direcciones, currentDefaultId, onPick }: DireccionPickerSheetProps) {
  const [picking, setPicking] = useState<string | null>(null)

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[1000]"
        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <div
        className="fixed left-0 right-0 bottom-0 z-[1001] flex flex-col"
        style={{
          background: '#ffffff',
          borderRadius: '32px 32px 0 0',
          maxHeight: '70dvh',
          animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
          <h2 className="text-[17px] font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
            Mis direcciones
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <span style={{ color: '#6B7280', fontSize: 16 }}>X</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-2">
          {direcciones.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
              No tienes direcciones guardadas
            </p>
          )}
          {direcciones.map((dir) => {
            const isActive = dir.id === currentDefaultId
            return (
              <button
                key={dir.id}
                onClick={async () => {
                  setPicking(dir.id)
                  await onPick(dir.id)
                  setPicking(null)
                }}
                disabled={picking !== null}
                className="w-full flex items-start gap-3 p-4 rounded-[24px] border-2 text-left transition-all disabled:opacity-60"
                style={{
                  borderColor: isActive ? '#062A63' : '#EAECF0',
                  background: isActive ? 'rgba(6,42,99,0.03)' : '#fff',
                }}
              >
                <Home size={17} style={{ color: '#062A63', marginTop: 1, flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                    {dir.nombre_completo}
                  </p>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
                    {dir.calle_numero}, {dir.colonia}, {dir.municipio}, {dir.estado} CP {dir.codigo_postal}
                  </p>
                  {isActive && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide mt-1 inline-block" style={{ color: '#062A63' }}>
                      Predeterminada
                    </span>
                  )}
                </div>
                {picking === dir.id && <Loader2 size={15} style={{ color: '#062A63' }} className="animate-spin shrink-0 mt-1" />}
              </button>
            )
          })}
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
