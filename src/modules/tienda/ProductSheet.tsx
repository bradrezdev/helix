import { useState } from 'react'
import { Plus, Minus, ShoppingBag, X, ChevronDown, Lock } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '../../hooks/useProducts'
import { useCart } from '../../store/cartStore'
import { getProductPrice } from '../../utils/pricing'
import { formatAmount, formatProductStatus, ProductStatus } from '../../lib/formatters'

interface Props {
  product: Product
  country: string
  membership: string
  isAdmin?: boolean
  onClose: () => void
  onKitOpen?: (product: Product) => void
  onEditProduct?: (product: Product) => void
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  disponible: { bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
  proximamente: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  agotado: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444' },
  privado: { bg: 'rgba(107,114,128,0.12)', color: '#6B7280' },
  protegido: { bg: 'rgba(107,114,128,0.12)', color: '#6B7280' },
  no_disponible: { bg: 'rgba(107,114,128,0.12)', color: '#6B7280' },
}

function sessionKey(code: string) {
  return `protected_${code}`
}

function isUnlocked(code: string): boolean {
  try {
    return !!sessionStorage.getItem(sessionKey(code))
  } catch {
    return false
  }
}

function unlock(code: string) {
  try {
    sessionStorage.setItem(sessionKey(code), '1')
  } catch { /* noop */ }
}

export function ProductSheet({ product, country, membership, isAdmin, onClose, onKitOpen, onEditProduct }: Props) {
  const { add, items, increment, decrement } = useCart()
  const cartItem = items.find((i) => i.product.code === product.code)
  const qty = cartItem?.quantity ?? 0

  const [imgError, setImgError] = useState(false)

  // Password gate state
  const isProtegido = product.product_status === ProductStatus.Protegido
  const [unlocked, setUnlocked] = useState(() => isUnlocked(product.code))
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  const needsPassword = isProtegido && !unlocked

  function handlePasswordSubmit() {
    if (passwordInput === product.protected_password) {
      unlock(product.code)
      setUnlocked(true)
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  const price = getProductPrice(product, country, membership)
  const statusStyle = STATUS_COLORS[product.product_status] ?? STATUS_COLORS.disponible
  const canPurchase =
    product.product_status === ProductStatus.Disponible ||
    (product.product_status === ProductStatus.Protegido && unlocked)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1000]"
        style={{ background: 'rgba(6,42,99,0.18)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[1001] rounded-t-3xl overflow-hidden"
        style={{
          background: '#fff',
          boxShadow: '0 -8px 40px rgba(6,42,99,0.14)',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom))',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: '#EAECF0' }} />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: '#F2F4F9' }}
        >
          <X size={16} style={{ color: '#9CA3AF' }} />
        </button>

        {/* Status badge */}
        {product.product_status !== ProductStatus.Disponible && (
          <div className="mx-5 mt-4 mb-0 flex">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: statusStyle.bg, color: statusStyle.color, fontFamily: 'Poppins, sans-serif' }}
            >
              {formatProductStatus(product.product_status)}
            </span>
          </div>
        )}

        {/* Image */}
        <div
          className="mx-5 mt-4 mb-4 rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ background: '#F2F4F9', height: '220px' }}
        >
          {product.image_url && !imgError ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <ShoppingBag size={64} style={{ color: '#D1D5DB' }} />
          )}
        </div>

        {/* Password gate */}
        {needsPassword && (
          <div className="px-5 mb-5">
            <div
              className="rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: '#F8FAFF', border: '1.5px solid #EAECF0' }}
            >
              <div className="flex items-center gap-2">
                <Lock size={16} style={{ color: '#062A63' }} />
                <p
                  className="text-sm font-semibold"
                  style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
                >
                  Este producto requiere contraseña
                </p>
              </div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false) }}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                placeholder="Ingresa la contraseña de acceso"
                className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
                style={{
                  background: '#fff',
                  color: '#383A3F',
                  fontFamily: 'Poppins, sans-serif',
                  border: passwordError ? '1.5px solid #EF4444' : '1.5px solid #EAECF0',
                }}
              />
              {passwordError && (
                <p className="text-xs" style={{ color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}>
                  Contraseña incorrecta
                </p>
              )}
              <button
                onClick={handlePasswordSubmit}
                className="w-full py-3 rounded-2xl text-white font-semibold text-sm"
                style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                Acceder
              </button>
            </div>
          </div>
        )}

        {/* Content (shown unless password gate active and not unlocked) */}
        {!needsPassword && (
          <div className="px-5">
            {/* Name + PV badge */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2
                className="text-xl font-semibold leading-tight"
                style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                {product.name}
              </h2>
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                style={{ background: 'rgba(12,188,229,0.12)', color: '#0CBCE5' }}
              >
                {product.pv} PV
              </span>
            </div>

            {/* Price */}
            <p
              className="text-2xl font-bold mb-3"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              {formatAmount(price, country)}
            </p>

            {/* Stock */}
            {product.stock <= 5 && product.stock > 0 && (
              <p
                className="text-xs mb-3"
                style={{ color: '#F59E0B', fontFamily: 'Poppins, sans-serif' }}
              >
                Solo {product.stock} disponible{product.stock !== 1 ? 's' : ''}
              </p>
            )}

            {/* Short description */}
            {product.short_description && (
              <p
                className="text-sm mb-4 leading-relaxed"
                style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
              >
                {product.short_description}
              </p>
            )}

            {/* Tags row */}
            <div className="flex flex-wrap gap-2 mb-4">
              {product.cantidad && (
                <span
                  className="text-xs px-3 py-1 rounded-full"
                  style={{ background: '#F2F4F9', color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                >
                  {product.cantidad}
                </span>
              )}
              {product.activos && product.activos.split(',').map((a) => (
                <span
                  key={a}
                  className="text-xs px-3 py-1 rounded-full"
                  style={{ background: '#F2F4F9', color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                >
                  {a.trim()}
                </span>
              ))}
            </div>

            {/* Full description */}
            {product.description && (
              <div className="mb-6">
                <div className="flex items-center gap-1 mb-1">
                  <ChevronDown size={14} style={{ color: '#9CA3AF' }} />
                  <span
                    className="text-xs font-medium uppercase tracking-wide"
                    style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
                  >
                    Descripción
                  </span>
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
                >
                  {product.description}
                </p>
              </div>
            )}

            {/* Kit CTA */}
            {product.is_kit && (
              <button
                onClick={() => { onClose(); onKitOpen?.(product) }}
                className="w-full py-4 rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-transform mb-3"
                style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                Armar kit
              </button>
            )}

            {/* Regular add-to-cart */}
            {!product.is_kit && canPurchase && (
              qty === 0 ? (
                <button
                  onClick={() => {
                    const result = add(product)
                    if (!result.ok) {
                      if (result.reason === 'kit_limit') toast.error('Solo puedes agregar 1 kit al carrito')
                      else if (result.reason === 'no_stock') toast.error('Producto sin stock disponible')
                      else toast.error('Has alcanzado el máximo disponible en stock')
                    }
                  }}
                  className="w-full py-4 rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-transform mb-3"
                  style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
                >
                  Añadir al carrito
                </button>
              ) : (
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => decrement(product.code)}
                    className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                    style={{ background: '#F2F4F9' }}
                  >
                    <Minus size={20} style={{ color: '#062A63' }} />
                  </button>
                  <span
                    className="text-2xl font-bold"
                    style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
                  >
                    {qty}
                  </span>
                  <button
                    onClick={() => {
                      const result = increment(product.code)
                      if (!result.ok) toast.error('Has alcanzado el máximo disponible en stock')
                    }}
                    className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                    style={{ background: '#062A63' }}
                  >
                    <Plus size={20} style={{ color: '#fff' }} />
                  </button>
                </div>
              )
            )}

            {/* Non-purchasable status */}
            {!product.is_kit && !canPurchase && (
              <div
                className="w-full py-4 rounded-2xl text-center text-base font-semibold mb-3"
                style={{
                  background: '#F2F4F9',
                  color: '#9CA3AF',
                  fontFamily: 'Poppins, sans-serif',
                }}
              >
                {product.product_status === ProductStatus.Proximamente
                  ? 'Próximamente disponible'
                  : product.product_status === ProductStatus.Agotado
                  ? 'Agotado'
                  : 'No disponible'}
              </div>
            )}

            {/* Admin edit button */}
            {isAdmin && onEditProduct && (
              <button
                onClick={() => { onClose(); onEditProduct(product) }}
                className="w-full py-3 rounded-2xl text-sm font-semibold active:scale-[0.98] transition-transform"
                style={{
                  background: 'transparent',
                  color: '#062A63',
                  fontFamily: 'Poppins, sans-serif',
                  border: '1.5px solid #EAECF0',
                }}
              >
                Editar producto
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
