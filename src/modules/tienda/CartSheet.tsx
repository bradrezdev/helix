import { ShoppingCart, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react'
import { useCart } from '../../store/cartStore'
import { useNavigate } from '@tanstack/react-router'

export function CartSheet({ onClose }: { onClose: () => void }) {
  const { items, increment, decrement, total, totalPV, count } = useCart()
  const navigate = useNavigate()

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
          <h3
            className="font-semibold text-base"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            Carrito · {count()} {count() === 1 ? 'producto' : 'productos'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#F2F4F9' }}>
            <X size={16} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 flex flex-col gap-2">
          {items.map(({ product, quantity }) => (
            <div
              key={product.code}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: '#F2F4F9' }}
            >
              {/* Mini image */}
              <div
                className="rounded-xl overflow-hidden shrink-0"
                style={{ width: 52, height: 52, background: '#E5E7EB' }}
              >
                {product.image_url && (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                )}
              </div>

              {/* Name + price */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
                  {product.name}
                </p>
                <p className="text-xs" style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>
                  ${product.price_socio_mxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} c/u
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
                  onClick={() => increment(product.code)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: '#062A63' }}
                >
                  <Plus size={13} color="#fff" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer — always visible, never clipped */}
        <div
          className="shrink-0 px-5 pt-3"
          style={{
            borderTop: '1px solid #EAECF0',
            paddingBottom: 16,
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm" style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>
              Total · {totalPV().toFixed(0)} PV
            </span>
            <span className="text-lg font-bold" style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}>
              ${total().toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </span>
          </div>
          <button
            onClick={() => { onClose(); navigate({ to: '/checkout' }) }}
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
    </>
  )
}
