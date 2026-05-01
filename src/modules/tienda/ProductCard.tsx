import { useState } from 'react'
import { ShoppingBag, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '../../hooks/useProducts'
import { useCart } from '../../store/cartStore'

interface Props {
  product: Product
  onOpen: (p: Product) => void
}

export function ProductCard({ product, onOpen }: Props) {
  const { add, items, increment, decrement } = useCart()
  const cartItem = items.find((i) => i.product.code === product.code)
  const qty = cartItem?.quantity ?? 0
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="rounded-[32px] overflow-hidden flex flex-col active:scale-[0.97] transition-transform"
      style={{
        background: '#fff',
        boxShadow: '0 2px 12px rgba(6,42,99,0.07)',
      }}
    >
      {/* Image tap → opens sheet */}
      <button
        className="w-full relative overflow-hidden"
        style={{ height: '156px', background: '#F2F4F9' }}
        onClick={() => onOpen(product)}
      >
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={40} style={{ color: '#D1D5DB' }} />
          </div>
        )}

        {/* PV badge */}
        <span
          className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(12,188,229,0.15)', color: '#0CBCE5' }}
        >
          {product.pv} PV
        </span>
      </button>

      {/* Info */}
      <div className="px-3 pt-2 pb-3 flex flex-col gap-1 flex-1">
        <button onClick={() => onOpen(product)} className="text-left">
          <p
            className="font-semibold text-sm leading-tight"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            {product.name}
          </p>
          {product.short_description && (
            <p
              className="text-[11px] leading-snug mt-0.5 line-clamp-2"
              style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
            >
              {product.short_description}
            </p>
          )}
        </button>

        <p
          className="font-bold text-sm mt-auto pt-1"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          ${product.price_socio_mxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>

        {/* +/- or add */}
        {qty === 0 ? (
          <button
            onClick={() => {
              const result = add(product)
              if (!result.ok) {
                if (result.reason === 'kit_limit') toast.error('Solo puedes agregar 1 kit al carrito')
                else if (result.reason === 'no_stock') toast.error('Producto sin stock disponible')
                else toast.error('Has alcanzado el máximo disponible en stock')
              }
            }}
            className="w-full mt-1 py-2 rounded-full flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            style={{ background: '#062A63' }}
          >
            <Plus size={14} color="#fff" />
            <span
              className="text-xs font-semibold text-white"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Añadir
            </span>
          </button>
        ) : (
          <div className="flex items-center justify-between mt-1">
            <button
              onClick={() => decrement(product.code)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold active:scale-95"
              style={{ background: '#F2F4F9', color: '#062A63' }}
            >
              −
            </button>
            <span
              className="text-sm font-bold"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              {qty}
            </span>
            <button
              onClick={() => {
                const result = increment(product.code)
                if (!result.ok) toast.error('Has alcanzado el máximo disponible en stock')
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold active:scale-95"
              style={{ background: '#062A63', color: '#fff' }}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
