import { useEffect, useRef, useState } from 'react'
import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from './store.ts'
import { useStoreProducts } from './hooks/useStoreProducts.ts'
import { getProductPrice } from './utils/pricing.ts'
import { useTaxRate } from './hooks/useTaxRate.ts'
import { formatAmount } from '../../../lib/formatters.ts'

export function CartSheet({
  onClose,
  onCheckout,
  country = 'MXN',
  membership = 'socio',
}: {
  onClose: () => void
  onCheckout: () => void
  country?: string
  membership?: string
}) {
  const { items, increment, decrement, total, totalPV, count, validateCart, isKitMode, setShowKitFilter } = useCart()
  const { data: freshProducts = [] } = useStoreProducts()
  const { rate: taxRate } = useTaxRate(country)
  const subtotal = total()
  const taxAmount = subtotal * taxRate
  const grandTotal = subtotal + taxAmount
  const [removedToast, setRemovedToast] = useState(false)
  const [showKitUpsell, setShowKitUpsell] = useState(false)
  const validatedRef = useRef(false)

  // Validate cart on open (once per mount)
  useEffect(() => {
    if (!validatedRef.current && freshProducts.length > 0) {
      validatedRef.current = true
      const { removedCodes } = validateCart(freshProducts)
      if (removedCodes.length > 0) {
        setRemovedToast(true)
        setTimeout(() => setRemovedToast(false), 4000)
      }
    }
  }, [freshProducts, validateCart])

  if (items.length === 0) {
    return (
      <>
        <div
          className="fixed inset-0 z-[1000]"
          style={{ background: 'rgba(6,42,99,0.18)', backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
        <div
          className="fixed left-[10px] right-[10px] z-[1001] rounded-t-[32px] rounded-b-[32px]"
          style={{
            bottom: 'calc(88px + env(safe-area-inset-bottom))',
            background: '#fff',
            boxShadow: '0 -8px 40px rgba(6,42,99,0.14)',
            paddingBottom: 16,
          }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full" style={{ background: '#EAECF0' }} />
          </div>
          <div className="px-5 py-10 flex flex-col items-center gap-3">
            <ShoppingCart size={48} style={{ color: '#D1D5DB' }} />
            <p style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }} className="text-sm">
              Tu carrito está vacío
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[1000]"
        style={{ background: 'rgba(6,42,99,0.18)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />
      <div
        className="fixed left-[10px] right-[10px] z-[1001] rounded-t-[32px] rounded-b-[32px]"
        style={{
          bottom: 'calc(88px + env(safe-area-inset-bottom))',
          background: '#fff',
          boxShadow: '0 -8px 40px rgba(6,42,99,0.14)',
          maxHeight: '70dvh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Handle + header */}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1 rounded-full" style={{ background: '#EAECF0' }} />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h3
              className="font-semibold text-base"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Carrito · {count()} {count() === 1 ? 'producto' : 'productos'}
            </h3>
            {/* Kit mode chip */}
            {isKitMode && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5"
                style={{ background: 'rgba(12,188,229,0.15)', color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}
              >
                Modo Kit activo
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#F2F4F9' }}>
            <X size={16} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Removed items toast */}
        {removedToast && (
          <div
            className="mx-5 mb-2 px-4 py-2 rounded-2xl text-xs"
            style={{
              background: 'rgba(245,158,11,0.10)',
              color: '#D97706',
              fontFamily: 'Poppins, sans-serif',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            Algunos productos fueron actualizados
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 flex flex-col gap-2">
          {items.map(({ product, quantity }) => {
            const isKitProduct = isKitMode && product.is_kit
            const isAddon = isKitMode && !product.is_kit && product.kit_type !== 'membresia'

            return (
              <div
                key={product.code}
                className={`flex items-center gap-3 p-3 rounded-2xl${isAddon ? ' ml-4' : ''}`}
                style={{ background: '#F2F4F9' }}
              >
                {/* Mini image */}
                <div
                  className="rounded-xl overflow-hidden shrink-0"
                  style={{ width: isAddon ? 44 : 52, height: isAddon ? 44 : 52, background: '#E5E7EB' }}
                >
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Name + price */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`font-semibold truncate${isAddon ? ' text-xs' : ' text-sm'}`} style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                      {product.name}
                    </p>
                    {isKitProduct && (
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: 'rgba(12,188,229,0.15)', color: '#0CBCE5', fontFamily: 'Poppins, sans-serif' }}
                      >
                        Kit
                      </span>
                    )}
                  </div>
                  <p className={`${isAddon ? 'text-[10px]' : 'text-xs'}`} style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>
                    {formatAmount(getProductPrice(product, country, membership), country)} c/u
                  </p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decrement(product.code)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: '#fff' }}
                  >
                    {quantity === 1
                      ? <Trash2 size={13} style={{ color: '#EF4444' }} />
                      : <Minus size={13} style={{ color: '#062A63' }} />}
                  </button>
                  <span className="text-sm font-bold w-4 text-center" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => {
                      const result = increment(product.code)
                      if (!result.ok) toast.error('Has alcanzado el máximo disponible en stock')
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: '#062A63' }}
                  >
                    <Plus size={13} color="#fff" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-5 pt-3"
          style={{
            borderTop: '1px solid #EAECF0',
            paddingBottom: 16,
          }}
        >
          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>
                Subtotal · {totalPV().toFixed(0)} PV
              </span>
              <span className="text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                {formatAmount(subtotal, country)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>
                Impuesto ({(taxRate * 100).toFixed(0)}%)
              </span>
              <span className="text-sm" style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}>
                {formatAmount(taxAmount, country)}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-1.5" style={{ borderColor: '#EAECF0' }}>
              <span className="text-sm font-semibold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                Total
              </span>
              <span className="text-lg font-bold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                {formatAmount(grandTotal, country)}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              const hasMembership = items.some(i => i.product.kit_type === 'membresia')
              const hasRealKit = items.some(i => i.product.is_kit && i.product.kit_type !== 'membresia')
              if (hasMembership && !hasRealKit) {
                setShowKitUpsell(true)
              } else {
                onClose()
                onCheckout()
              }
            }}
            className="w-full py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: '#062A63' }}
          >
            <span className="text-white font-semibold" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Ir a pagar
            </span>
            <ArrowRight size={18} color="#fff" />
          </button>
        </div>
      </div>

      {/* Kit upsell AlertDialog */}
      {showKitUpsell && (
        <>
          <div
            className="fixed inset-0 z-[1100]"
            style={{ background: 'rgba(6,42,99,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowKitUpsell(false)}
          />
          <div
            className="fixed left-[16px] right-[16px] top-1/2 -translate-y-1/2 z-[1101] rounded-[32px] overflow-hidden"
            style={{
              background: '#fff',
              boxShadow: '0 10px 40px rgba(6,42,99,0.2)',
            }}
          >
            <div className="flex flex-col items-center pt-8 px-6 pb-2 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(12,188,229,0.12)' }}
              >
                <Gift size={28} style={{ color: '#0CBCE5' }} />
              </div>
              <h2
                className="text-lg font-bold leading-tight mb-2"
                style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                ¿Quieres añadir un Paquete de Inicio?
              </h2>
              <p
                className="text-sm leading-snug max-w-[280px]"
                style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
              >
                Aprovecha tu registro para comenzar con tu kit de productos ONANO. Puedes añadirlo ahora o comprarlo después.
              </p>
            </div>
            <div className="px-6 pt-4 pb-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  setShowKitFilter(true)
                  setShowKitUpsell(false)
                  onClose()
                }}
                className="w-full py-4 rounded-full font-semibold text-sm active:scale-[0.98] transition-transform"
                style={{ background: '#062A63', color: '#fff', fontFamily: 'Poppins, sans-serif' }}
              >
                Añadir Paquete de Inicio
              </button>
              <button
                onClick={() => {
                  setShowKitUpsell(false)
                  onClose()
                  onCheckout()
                }}
                className="w-full py-4 rounded-full font-semibold text-sm active:scale-[0.98] transition-transform"
                style={{ background: '#F2F4F9', color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                Continuar sin kit
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
