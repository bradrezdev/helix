import { useState } from 'react'
import { Plus, Minus, ShoppingBag, X, ChevronDown } from 'lucide-react'
import type { Product } from '../../hooks/useProducts'
import { useCart } from '../../store/cartStore'

interface Props {
  product: Product
  onClose: () => void
}

export function ProductSheet({ product, onClose }: Props) {
  const { add, items, increment, decrement } = useCart()
  const cartItem = items.find((i) => i.product.code === product.code)
  const qty = cartItem?.quantity ?? 0

  const [imgError, setImgError] = useState(false)

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

        {/* Image */}
        <div
          className="mx-5 mt-2 mb-4 rounded-2xl overflow-hidden flex items-center justify-center"
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

        {/* Content */}
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
            ${product.price_socio_mxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            <span className="text-sm font-normal ml-1" style={{ color: '#9CA3AF' }}>MXN</span>
          </p>

          {/* Short description */}
          {product.short_description && (
            <p
              className="text-sm mb-4 leading-relaxed"
              style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
            >
              {product.short_description}
            </p>
          )}

          {/* Tags row: cantidad + activos */}
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

          {/* Add to cart */}
          {qty === 0 ? (
            <button
              onClick={() => add(product)}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base active:scale-[0.98] transition-transform"
              style={{ background: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Añadir al carrito
            </button>
          ) : (
            <div className="flex items-center justify-between">
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
                onClick={() => increment(product.code)}
                className="w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform"
                style={{ background: '#062A63' }}
              >
                <Plus size={20} style={{ color: '#fff' }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
