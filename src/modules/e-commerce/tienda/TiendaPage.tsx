import { useEffect, useState, useRef } from 'react'
import { MoreHorizontal, X, Star, Info } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../auth/hooks/useAuth.ts'
import { useProfile } from '../../auth/hooks/useProfile.ts'
import { useKitEligibility } from '../../auth/hooks/useKitEligibility.ts'
import { useStoreProducts } from './hooks/useStoreProducts.ts'
import { useProductWhitelist } from './hooks/useProductWhitelist.ts'
import { usePurchasedKits } from './hooks/usePurchasedKits.ts'
import { useCart } from './store.ts'
import type { Product } from './hooks/useProducts.ts'
import { ProductSheet } from './ProductSheet.tsx'
import { CartSheet } from './CartSheet.tsx'
import { StoreSectionsView } from './components/StoreSectionsView.tsx'
import { KitBuilderSheet } from './components/KitBuilderSheet.tsx'
import { AddProductSheet } from './components/AddProductSheet.tsx'
import { EditStatusSheet } from './components/EditStatusSheet.tsx'
import { useStoreSections } from './hooks/useStoreSections.ts'
import { getCountryCurrency } from './utils/pricing.ts'

function useIsAdmin(userId: string | undefined): boolean {
  const { profile } = useProfile(userId ?? '')
  return profile?.is_admin === true
}

// Membresía section — shown only to cliente_preferente
function MembresiaSection({
  country,
  onSelect,
}: {
  country: string
  onSelect: (product: Product) => void
}) {
  const { data: products = [], isLoading } = useStoreProducts()
  const membresiaProduct = products.find((p) => p.kit_type === 'membresia')

  if (isLoading || !membresiaProduct) return null

  const price =
    country === 'MXN'
      ? membresiaProduct.price_public_mxn
      : country === 'COP'
        ? membresiaProduct.price_public_cop
        : country === 'EUR'
          ? membresiaProduct.price_public_eur
          : membresiaProduct.price_public_usd

  const currencySymbol =
    country === 'MXN' ? 'MX$' : country === 'COP' ? 'COP$' : country === 'EUR' ? '€' : 'USD$'

  return (
    <div className="mb-6">
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        Membresía
      </p>
      <div
        className="rounded-[24px] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #062A63 0%, #0CBCE5 100%)',
          boxShadow: '0 4px 20px rgba(6,42,99,0.18)',
        }}
      >
        <div className="px-5 py-5 flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <Star size={22} fill="white" style={{ color: '#fff' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="font-bold text-base leading-tight"
              style={{ color: '#fff', fontFamily: 'Poppins, sans-serif' }}
            >
              Hazte Socio
            </p>
            <p
              className="text-xs mt-0.5 opacity-80"
              style={{ color: '#fff', fontFamily: 'Poppins, sans-serif' }}
            >
              Desbloquea todos los beneficios ONANO
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {price != null && (
              <p
                className="text-base font-bold"
                style={{ color: '#fff', fontFamily: 'Poppins, sans-serif' }}
              >
                {currencySymbol} {price}
              </p>
            )}
            <button
              onClick={() => onSelect(membresiaProduct)}
              className="px-4 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: '#fff',
                color: '#062A63',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Activar →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Admin-only section showing all kit products
function AdminKitSection({
  country,
  membership,
  onKitSelect,
}: {
  country: string
  membership: string
  onKitSelect: (product: Product) => void
}) {
  const { data: kitProducts = [], isLoading } = useStoreProducts({ kitOnly: true })

  if (isLoading || kitProducts.length === 0) return null

  return (
    <div className="mb-6">
      <p
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
      >
        Paquetes de Inicio
      </p>
      <div className="flex flex-col gap-2">
        {kitProducts.map((product) => (
          <div
            key={product.code}
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: '#fff', border: '1px solid #EAECF0' }}
          >
            <div
              className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
              style={{ background: '#F2F4F9' }}
            >
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold leading-tight"
                style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                {product.name}
              </p>
              <div className="flex gap-2 mt-1">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(12,188,229,0.15)', color: '#0CBCE5' }}
                >
                  {product.pv} PV
                </span>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(6,42,99,0.10)', color: '#062A63' }}
                >
                  {product.cv} CV
                </span>
              </div>
            </div>
            <button
              onClick={() => onKitSelect(product)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: '#062A63', color: '#fff', fontFamily: 'Poppins, sans-serif' }}
            >
              Ver Kit
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// Kit-only view for new users
function KitListView({
  country,
  membership,
  onKitSelect,
}: {
  country: string
  membership: string
  onKitSelect: (product: Product) => void
}) {
  const { data: kitProducts = [], isLoading } = useStoreProducts({ kitOnly: true })
  const { data: purchasedCodes = [] } = usePurchasedKits()
  const availableKits = kitProducts.filter((k) => !purchasedCodes.includes(k.code))

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-[32px] animate-pulse"
            style={{ height: 220, background: '#E5E7EB' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {availableKits.map((product) => (
        <button
          key={product.code}
          onClick={() => onKitSelect(product)}
          className="rounded-[28px] overflow-hidden flex flex-col text-left active:scale-[0.97] transition-transform"
          style={{
            background: '#fff',
            boxShadow: '0 2px 12px rgba(6,42,99,0.07)',
          }}
        >
          <div
            className="w-full relative overflow-hidden"
            style={{ height: 130, background: '#F2F4F9' }}
          >
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span style={{ color: '#D1D5DB', fontSize: 36 }}>🛍</span>
              </div>
            )}
            <span
              className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(12,188,229,0.15)', color: '#0CBCE5' }}
            >
              {product.pv} PV
            </span>
          </div>
          <div className="px-3 pt-2 pb-3 flex flex-col gap-1 flex-1">
            <p
              className="font-semibold text-sm leading-tight"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              {product.name}
            </p>
            {product.short_description && (
              <p
                className="text-[11px] leading-snug line-clamp-2"
                style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
              >
                {product.short_description}
              </p>
            )}
            <p
              className="text-sm font-bold mt-auto pt-1"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Ver kit →
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}

export function TiendaPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile(user?.id ?? '')
  const isAdmin = useIsAdmin(user?.id)
  const { hasKit, isLoading: kitLoading } = useKitEligibility(user?.id)
  const { isKitMode, setKitMode, validateCart, showKitFilter, setShowKitFilter } = useCart()
  const { data: purchasedCodes = [] } = usePurchasedKits()

  const country: string = getCountryCurrency(profile?.country ?? 'MX')
  const membership: string = profile?.membership ?? 'socio'

  // Product detail / kit sheet state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [kitProduct, setKitProduct] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)

  // Admin sheet state
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editProductInit, setEditProductInit] = useState<Product | null>(null)
  const [editStatusCodes, setEditStatusCodes] = useState<string[] | null>(null)

  // useStoreSections for categorias list (needed by AddProductSheet)
  const { sections } = useStoreSections()
  const categorias = sections.byCategoria.map((s) => s.categoria)

  // Validate cart on mount after products load
  const { data: freshProducts = [] } = useStoreProducts()
  const validatedRef = useRef(false)
  useEffect(() => {
    if (!validatedRef.current && freshProducts.length > 0) {
      validatedRef.current = true
      validateCart(freshProducts)
    }
  }, [freshProducts, validateCart])

  // Product whitelist — invalidate cache after purchase
  const { invalidateCache } = useProductWhitelist(user?.id, profile)
  const purchaseCompleted = useCart((s) => s.purchaseCompleted)

  // Invalidate product cache when returning from successful purchase
  useEffect(() => {
    if (purchaseCompleted) {
      invalidateCache()
      useCart.getState().resetPurchaseFlag()
    }
  }, [purchaseCompleted, invalidateCache])

  function handleProductSelect(product: Product) {
    if (product.is_kit) {
      setKitProduct(product)
    } else {
      setSelectedProduct(product)
    }
  }

  function handleAdminEditProduct(product: Product) {
    setEditProductInit(product)
    setShowAddProduct(true)
  }

  if (kitLoading) {
    return (
      <main
        className="min-h-screen px-4 pt-8"
        style={{ background: '#F2F4F9', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}
      >
        <div className="h-8 w-32 rounded-full animate-pulse mb-8" style={{ background: '#E5E7EB' }} />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-[32px] animate-pulse" style={{ height: 260, background: '#E5E7EB' }} />
          ))}
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen px-4 pt-8 relative"
      style={{ background: '#F2F4F9', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          {showKitFilter ? (
            <h1
              className="text-2xl font-bold leading-tight"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Selecciona tu Paquete de Inicio
            </h1>
          ) : (
            <>
              <h1
                className="text-2xl font-bold leading-tight"
                style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                Tienda
              </h1>
              <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
                {hasKit ? 'Catálogo completo' : 'Selecciona tu kit de inicio'}
              </p>
            </>
          )}
        </div>

        {/* Admin menu button */}
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowAdminMenu((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-full"
              style={{ background: '#fff', boxShadow: '0 1px 4px rgba(6,42,99,0.08)' }}
            >
              <MoreHorizontal size={18} style={{ color: '#062A63' }} />
            </button>

            {showAdminMenu && (
              <>
                <div
                  className="fixed inset-0 z-[900]"
                  onClick={() => setShowAdminMenu(false)}
                />
                <div
                  className="absolute right-0 top-11 z-[901] rounded-2xl py-1 min-w-[180px]"
                  style={{
                    background: '#fff',
                    boxShadow: '0 4px 20px rgba(6,42,99,0.12)',
                    border: '1px solid #EAECF0',
                  }}
                >
                  <button
                    onClick={() => {
                      setShowAdminMenu(false)
                      setEditProductInit(null)
                      setShowAddProduct(true)
                    }}
                    className="w-full px-4 py-3 text-left text-sm"
                    style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                  >
                    Añadir producto
                  </button>
                  <div style={{ height: 1, background: '#EAECF0', margin: '0 12px' }} />
                  <button
                    onClick={() => {
                      setShowAdminMenu(false)
                      setEditStatusCodes([])
                    }}
                    className="w-full px-4 py-3 text-left text-sm"
                    style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
                  >
                    Editar estado de producto
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Kit mode banner — only for users without a kit */}
      {isKitMode && !hasKit && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-2xl mb-4"
          style={{ background: 'rgba(12,188,229,0.10)', border: '1.5px solid rgba(12,188,229,0.3)' }}
        >
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
            >
              Modo Kit activo
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}
            >
              Estás armando tu kit de inicio
            </p>
          </div>
          <button
            onClick={() => setKitMode(false, null)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: '#fff', color: '#EF4444', fontFamily: 'Poppins, sans-serif', border: '1px solid #FECACA' }}
          >
            <X size={12} />
            Cancelar Kit
          </button>
        </div>
      )}

      {/* socio_pendiente banner */}
      {membership === 'socio_pendiente' && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-4"
          style={{
            background: '#062A63',
            boxShadow: '0 4px 16px rgba(6,42,99,0.18)',
          }}
        >
          <div className="shrink-0 mt-0.5">
            <Info size={18} color="#fff" />
          </div>
          <p
            className="text-sm leading-snug"
            style={{ color: '#fff', fontFamily: 'Poppins, sans-serif' }}
          >
            ¡Ya casi eres Socio! Selecciona la Membresía de Socio para activar tu cuenta. También puedes añadir un Paquete de Inicio a tu compra.
          </p>
        </div>
      )}

      {/* Kit filter mode — show only kit products */}
      {showKitFilter ? (
        <KitListView
          country={country}
          membership={membership}
          onKitSelect={(p) => setKitProduct(p)}
        />
      ) : isAdmin || hasKit || membership === 'socio_pendiente' || membership === 'cliente_preferente' ? (
        <>
          {/* Paquetes de Inicio section — admin only */}
          {isAdmin && (
            <AdminKitSection
              country={country}
              membership={membership}
              onKitSelect={(p) => setKitProduct(p)}
            />
          )}
          {/* Membresía section — for cliente_preferente and socio_pendiente, hidden after upgrade to socio */}
          {!isAdmin && (membership === 'cliente_preferente' || membership === 'socio_pendiente') && membership !== 'socio' && (
            <MembresiaSection
              country={country}
              onSelect={handleProductSelect}
            />
          )}
          {(() => {
            // Only exclude kit products, not components like O5MAX
            // This prevents store sections from disappearing when all items are filtered
            const kitOnlyExcluded = freshProducts
              .filter(p => p.is_kit && purchasedCodes.includes(p.code))
              .map(p => p.code)
            return (
              <StoreSectionsView
                country={country}
                membership={membership}
                isAdmin={isAdmin}
                excludeProductCodes={kitOnlyExcluded}
                onProductSelect={handleProductSelect}
                onAddProduct={isAdmin ? () => { setEditProductInit(null); setShowAddProduct(true) } : undefined}
                onEditStatus={isAdmin ? (codes) => setEditStatusCodes(codes) : undefined}
              />
            )
          })()}
        </>
      ) : (
        <KitListView
          country={country}
          membership={membership}
          onKitSelect={(p) => setKitProduct(p)}
        />
      )}

      {/* ProductSheet for non-kit products */}
      {selectedProduct && (
        <ProductSheet
          product={selectedProduct}
          country={country}
          membership={membership}
          isAdmin={isAdmin}
          onClose={() => setSelectedProduct(null)}
          onKitOpen={(p) => { setSelectedProduct(null); setKitProduct(p) }}
          onEditProduct={handleAdminEditProduct}
        />
      )}

      {/* KitBuilderSheet */}
      {kitProduct && (
        <KitBuilderSheet
          kit={kitProduct}
          country={country}
          membership={membership}
          onClose={() => setKitProduct(null)}
          onKitConfirmed={() => {
            setKitProduct(null)
            if (showKitFilter) {
              setShowKitFilter(false)
              navigate({ to: '/checkout' })
            } else {
              setCartOpen(true)
            }
          }}
        />
      )}

      {/* AddProductSheet */}
      {showAddProduct && (
        <AddProductSheet
          open={showAddProduct}
          onClose={() => { setShowAddProduct(false); setEditProductInit(null) }}
          categorias={categorias}
          initialProduct={editProductInit}
        />
      )}

      {/* EditStatusSheet */}
      {editStatusCodes !== null && (
        <EditStatusSheet
          open={true}
          onClose={() => setEditStatusCodes(null)}
          selectedCodes={editStatusCodes}
        />
      )}

      {/* CartSheet */}
      {cartOpen && (
        <CartSheet
          onClose={() => setCartOpen(false)}
          onCheckout={() => navigate({ to: '/checkout' })}
          country={country}
          membership={membership}
        />
      )}
    </main>
  )
}
