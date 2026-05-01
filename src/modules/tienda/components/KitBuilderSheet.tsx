import { useState } from 'react'
import { X, ShoppingBag, Plus, Minus } from 'lucide-react'
import type { Product } from '../../../hooks/useProducts'
import { useStoreProducts } from '../../../hooks/useStoreProducts'
import { useCart } from '../../../store/cartStore'
import { getProductPrice } from '../../../utils/pricing'
import { formatAmount } from '../../../lib/formatters'

interface KitBuilderSheetProps {
  kit: Product | null
  onClose: () => void
  onKitConfirmed?: () => void
  country: string
  membership: string
}

interface KitSelection {
  product: Product
  qty: number
}

export function KitBuilderSheet({ kit, onClose, onKitConfirmed, country, membership }: KitBuilderSheetProps) {
  const [selections, setSelections] = useState<KitSelection[]>([])
  const { data: allProducts = [] } = useStoreProducts()
  const { setKitMode, clear, add } = useCart()

  if (!kit) return null

  const addonProducts = allProducts.filter(
    (p) => !p.is_kit && p.product_status === 'disponible' && p.code !== kit.code
  )

  const accumulatedPV = selections.reduce((sum, s) => sum + s.product.pv * s.qty, 0)
  const accumulatedCV = selections.reduce((sum, s) => sum + s.product.cv * s.qty, 0)

  const kitPV = kit.pv
  const kitCV = kit.cv

  const pvProgress = Math.min((accumulatedPV / kitPV) * 100, 100)
  const cvProgress = Math.min((accumulatedCV / kitCV) * 100, 100)

  const continueEnabled = accumulatedPV >= kitPV && accumulatedCV >= kitCV

  function canAdd(product: Product): boolean {
    const sel = selections.find((s) => s.product.code === product.code)
    const addedPV = sel ? sel.qty * product.pv : 0
    const addedCV = sel ? sel.qty * product.cv : 0
    return (
      accumulatedPV - addedPV + (addedPV + product.pv) <= kitPV &&
      accumulatedCV - addedCV + (addedCV + product.cv) <= kitCV
    )
  }

  function increment(product: Product) {
    if (!canAdd(product)) return
    setSelections((prev) => {
      const existing = prev.find((s) => s.product.code === product.code)
      if (existing) {
        return prev.map((s) =>
          s.product.code === product.code ? { ...s, qty: s.qty + 1 } : s
        )
      }
      return [...prev, { product, qty: 1 }]
    })
  }

  function decrement(product: Product) {
    setSelections((prev) =>
      prev
        .map((s) =>
          s.product.code === product.code ? { ...s, qty: s.qty - 1 } : s
        )
        .filter((s) => s.qty > 0)
    )
  }

  function handleConfirm() {
    // Set kit mode and rebuild cart with kit + addons
    setKitMode(true, kit.kit_type ?? null)
    // setKitMode clears cart; re-add kit + selections
    add(kit)
    for (const sel of selections) {
      for (let i = 0; i < sel.qty; i++) {
        add(sel.product)
      }
    }
    onKitConfirmed?.()
    onClose()
  }

  const kitPrice = getProductPrice(kit, country, membership)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[2000]"
        style={{ background: 'rgba(6,42,99,0.22)', backdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[2001] flex flex-col"
        style={{
          background: '#fff',
          borderRadius: '32px 32px 0 0',
          maxHeight: '92dvh',
          boxShadow: '0 -8px 40px rgba(6,42,99,0.14)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: '#EAECF0' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <h2
            className="text-[17px] font-semibold"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            Arma tu kit
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: '#F2F4F9' }}
          >
            <X size={16} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* Kit product info */}
          <div
            className="flex items-center gap-3 p-3 rounded-2xl mb-4"
            style={{ background: '#F2F4F9' }}
          >
            <div
              className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
              style={{ background: '#E5E7EB' }}
            >
              {kit.image_url ? (
                <img src={kit.image_url} alt={kit.name} className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag size={28} style={{ color: '#D1D5DB' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-semibold text-sm leading-tight"
                style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                {kit.name}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
              >
                {formatAmount(kitPrice, country)}
              </p>
              <div className="flex gap-2 mt-1">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(12,188,229,0.15)', color: '#0CBCE5' }}
                >
                  {kit.pv} PV
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(6,42,99,0.10)', color: '#062A63' }}
                >
                  {kit.cv} CV
                </span>
              </div>
            </div>
          </div>

          {/* PV/CV progress */}
          <div className="mb-4 flex flex-col gap-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span
                  className="text-xs font-medium"
                  style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
                >
                  PV acumulados
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: accumulatedPV >= kitPV ? '#10B981' : '#062A63',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {accumulatedPV} / {kitPV}
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: '#EAECF0' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${pvProgress}%`,
                    background: accumulatedPV >= kitPV ? '#10B981' : '#0CBCE5',
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span
                  className="text-xs font-medium"
                  style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
                >
                  CV acumulados
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{
                    color: accumulatedCV >= kitCV ? '#10B981' : '#062A63',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                >
                  {accumulatedCV} / {kitCV}
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ background: '#EAECF0' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${cvProgress}%`,
                    background: accumulatedCV >= kitCV ? '#10B981' : '#062A63',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Add-on products */}
          <p
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
          >
            Selecciona productos adicionales
          </p>

          {addonProducts.length === 0 && (
            <p
              className="text-sm text-center py-6"
              style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
            >
              No hay productos disponibles
            </p>
          )}

          <div className="flex flex-col gap-2">
            {addonProducts.map((product) => {
              const sel = selections.find((s) => s.product.code === product.code)
              const qty = sel?.qty ?? 0
              const addable = canAdd(product)
              const price = getProductPrice(product, country, membership)

              return (
                <div
                  key={product.code}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{
                    background: qty > 0 ? 'rgba(12,188,229,0.06)' : '#F8FAFF',
                    border: qty > 0 ? '1.5px solid rgba(12,188,229,0.3)' : '1.5px solid transparent',
                  }}
                >
                  {/* Image */}
                  <div
                    className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: '#EAECF0' }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ShoppingBag size={20} style={{ color: '#D1D5DB' }} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold leading-tight"
                      style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {product.name}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
                    >
                      {formatAmount(price, country)} · {product.pv} PV · {product.cv} CV
                    </p>
                  </div>

                  {/* Controls */}
                  {qty === 0 ? (
                    <button
                      onClick={() => increment(product)}
                      disabled={!addable}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
                      style={{ background: '#062A63' }}
                    >
                      <Plus size={14} color="#fff" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => decrement(product)}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: '#F2F4F9' }}
                      >
                        <Minus size={12} style={{ color: '#062A63' }} />
                      </button>
                      <span
                        className="text-sm font-bold w-4 text-center"
                        style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
                      >
                        {qty}
                      </span>
                      <button
                        onClick={() => increment(product)}
                        disabled={!addable}
                        className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-40"
                        style={{ background: '#062A63' }}
                      >
                        <Plus size={12} color="#fff" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer CTA */}
        <div
          className="shrink-0 px-5 py-4"
          style={{ borderTop: '1px solid #F2F4F9' }}
        >
          {!continueEnabled && (
            <p
              className="text-xs text-center mb-3"
              style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
            >
              Selecciona productos hasta completar {kitPV} PV y {kitCV} CV
            </p>
          )}
          <button
            onClick={handleConfirm}
            disabled={!continueEnabled}
            className="w-full py-4 rounded-full font-semibold transition-all disabled:opacity-40 active:scale-[0.98]"
            style={{ background: '#062A63', color: '#fff', fontFamily: 'Poppins, sans-serif' }}
          >
            Confirmar kit
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
