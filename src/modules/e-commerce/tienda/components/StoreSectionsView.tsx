import { useState } from 'react'
import { ShoppingBag, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useStoreSections } from '../hooks/useStoreSections.ts'
import type { Product } from '../hooks/useProducts.ts'
import type { Categoria } from '../hooks/useStoreSections.ts'
import { useCart } from '../store.ts'
import { getProductPrice } from '../utils/pricing.ts'
import { formatAmount, formatProductStatus, ProductStatus } from '../../../../lib/formatters.ts'

interface StoreSectionsViewProps {
  country: string
  membership: string
  isAdmin: boolean
  onProductSelect: (product: Product) => void
  onAddProduct?: () => void
  onEditStatus?: (codes: string[]) => void
}

export function StoreSectionsView({
  country,
  membership,
  isAdmin,
  onProductSelect,
  onAddProduct,
  onEditStatus,
}: StoreSectionsViewProps) {
  const { sections, isLoading } = useStoreSections()
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())
  const [multiSelectMode, setMultiSelectMode] = useState(false)

  function toggleSelect(code: string) {
    setSelectedCodes((prev) => {
      const next = new Set(prev)
      if (next.has(code)) {
        next.delete(code)
      } else {
        next.add(code)
      }
      return next
    })
  }

  function handleEditStatus() {
    if (onEditStatus && selectedCodes.size > 0) {
      onEditStatus(Array.from(selectedCodes))
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div
              className="h-4 w-32 rounded-full mb-3 animate-pulse"
              style={{ background: '#E5E7EB' }}
            />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="shrink-0 rounded-[32px] animate-pulse"
                  style={{ width: 160, height: 200, background: '#E5E7EB' }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const hasSections =
    sections.novedades.length > 0 ||
    sections.recomendados.length > 0 ||
    sections.masPedidos.length > 0 ||
    sections.byCategoria.some((s) => s.products.length > 0)

  if (!hasSections) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <ShoppingBag size={48} style={{ color: '#D1D5DB' }} />
        <p
          className="text-sm mt-4"
          style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}
        >
          No hay productos disponibles
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Admin toolbar */}
      {isAdmin && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => {
              setMultiSelectMode((v) => !v)
              setSelectedCodes(new Set())
            }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: multiSelectMode ? '#062A63' : '#F2F4F9',
              color: multiSelectMode ? '#fff' : '#383A3F',
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {multiSelectMode ? 'Cancelar' : 'Seleccionar'}
          </button>

          {multiSelectMode && selectedCodes.size > 0 && (
            <button
              onClick={handleEditStatus}
              className="px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: '#0CBCE5',
                color: '#fff',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              Cambiar estado ({selectedCodes.size})
            </button>
          )}
        </div>
      )}

      {/* Sections */}
      <div className="flex flex-col gap-6">
        {sections.novedades.length > 0 && (
          <HorizontalSection
            title="Últimas novedades"
            products={sections.novedades}
            country={country}
            membership={membership}
            isAdmin={isAdmin}
            multiSelectMode={multiSelectMode}
            selectedCodes={selectedCodes}
            onSelect={onProductSelect}
            onToggleSelect={toggleSelect}
          />
        )}

        {sections.recomendados.length > 0 && (
          <HorizontalSection
            title="Recomendados por nosotros"
            products={sections.recomendados}
            country={country}
            membership={membership}
            isAdmin={isAdmin}
            multiSelectMode={multiSelectMode}
            selectedCodes={selectedCodes}
            onSelect={onProductSelect}
            onToggleSelect={toggleSelect}
          />
        )}

        {sections.masPedidos.length > 0 && (
          <HorizontalSection
            title="Productos más pedidos"
            products={sections.masPedidos}
            country={country}
            membership={membership}
            isAdmin={isAdmin}
            multiSelectMode={multiSelectMode}
            selectedCodes={selectedCodes}
            onSelect={onProductSelect}
            onToggleSelect={toggleSelect}
          />
        )}

        {sections.byCategoria.map(({ categoria, products }) =>
          products.length === 0 ? null : (
            <CategorySection
              key={categoria.id}
              categoria={categoria}
              products={products}
              country={country}
              membership={membership}
              isAdmin={isAdmin}
              multiSelectMode={multiSelectMode}
              selectedCodes={selectedCodes}
              onSelect={onProductSelect}
              onToggleSelect={toggleSelect}
            />
          )
        )}
      </div>

      {/* Admin FAB */}
      {isAdmin && onAddProduct && (
        <button
          onClick={onAddProduct}
          className="fixed bottom-32 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          style={{ background: '#062A63' }}
          aria-label="Agregar producto"
        >
          <Plus size={22} color="#fff" />
        </button>
      )}
    </div>
  )
}

// ── HorizontalSection ─────────────────────────────────────────────────────────

interface SectionProps {
  title: string
  products: Product[]
  country: string
  membership: string
  isAdmin: boolean
  multiSelectMode: boolean
  selectedCodes: Set<string>
  onSelect: (product: Product) => void
  onToggleSelect: (code: string) => void
}

function HorizontalSection({
  title,
  products,
  country,
  membership,
  isAdmin,
  multiSelectMode,
  selectedCodes,
  onSelect,
  onToggleSelect,
}: SectionProps) {
  return (
    <div>
      <p
        className="text-[13px] font-semibold mb-3 px-0.5"
        style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
      >
        {title}
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {products.map((product) => (
          <MiniProductCard
            key={product.code}
            product={product}
            country={country}
            membership={membership}
            isAdmin={isAdmin}
            isSelected={selectedCodes.has(product.code)}
            multiSelectMode={multiSelectMode}
            onSelect={() => onSelect(product)}
            onToggle={() => onToggleSelect(product.code)}
          />
        ))}
      </div>
    </div>
  )
}

// ── CategorySection ───────────────────────────────────────────────────────────

interface CategorySectionProps extends SectionProps {
  categoria: Categoria
}

function CategorySection({
  categoria,
  products,
  country,
  membership,
  isAdmin,
  multiSelectMode,
  selectedCodes,
  onSelect,
  onToggleSelect,
}: CategorySectionProps) {
  return (
    <div>
      <p
        className="text-[13px] font-semibold mb-3 px-0.5"
        style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
      >
        {categoria.nombre}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <GridProductCard
            key={product.code}
            product={product}
            country={country}
            membership={membership}
            isAdmin={isAdmin}
            isSelected={selectedCodes.has(product.code)}
            multiSelectMode={multiSelectMode}
            onSelect={() => onSelect(product)}
            onToggle={() => onToggleSelect(product.code)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Status ribbon helper ──────────────────────────────────────────────────────

const STATUS_RIBBON: Partial<Record<string, { label: string; bg: string }>> = {
  proximamente: { label: 'Próximamente', bg: '#F59E0B' },
  no_disponible: { label: 'No disponible', bg: '#9CA3AF' },
  agotado: { label: 'Agotado', bg: '#EF4444' },
}

function StatusRibbon({ status }: { status: string | null | undefined }) {
  if (!status) return null
  const cfg = STATUS_RIBBON[status]
  if (!cfg) return null
  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center py-1 z-10"
      style={{ background: cfg.bg }}
    >
      <span
        className="text-[9px] font-bold uppercase tracking-wide text-white"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {cfg.label}
      </span>
    </div>
  )
}

// ── Add-to-cart disabled statuses ─────────────────────────────────────────────

const BLOCKED_STATUSES = new Set([
  ProductStatus.Proximamente,
  ProductStatus.NoDisponible,
  ProductStatus.Agotado,
])

interface CardProps {
  product: Product
  country: string
  membership: string
  isAdmin: boolean
  isSelected: boolean
  multiSelectMode: boolean
  onSelect: () => void
  onToggle: () => void
}

function MiniProductCard({
  product,
  country,
  membership,
  isAdmin,
  isSelected,
  multiSelectMode,
  onSelect,
  onToggle,
}: CardProps) {
  const [imgError, setImgError] = useState(false)
  const { add, items, increment, decrement } = useCart()
  const cartItem = items.find((i) => i.product.code === product.code)
  const qty = cartItem?.quantity ?? 0
  const price = getProductPrice(product, country, membership)

  function handleMainClick() {
    if (multiSelectMode) {
      onToggle()
    } else {
      onSelect()
    }
  }

  return (
    <div
      className="shrink-0 rounded-[24px] overflow-hidden flex flex-col relative"
      style={{
        width: 152,
        background: '#fff',
        boxShadow: '0 2px 12px rgba(6,42,99,0.07)',
        border: isSelected ? '2px solid #062A63' : '2px solid transparent',
      }}
    >
      {/* Image */}
      <button
        className="w-full relative overflow-hidden"
        style={{ height: 120, background: '#F2F4F9' }}
        onClick={handleMainClick}
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
            <ShoppingBag size={32} style={{ color: '#D1D5DB' }} />
          </div>
        )}

        {/* Status ribbon (non-admin users see it too) */}
        <StatusRibbon status={product.product_status} />

        {/* PV badge */}
        <span
          className="absolute top-1.5 right-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(12,188,229,0.15)', color: '#0CBCE5' }}
        >
          {product.pv} PV
        </span>

        {/* Admin: selection checkbox */}
        {isAdmin && multiSelectMode && (
          <div
            className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md flex items-center justify-center"
            style={{
              background: isSelected ? '#062A63' : 'rgba(255,255,255,0.9)',
              border: isSelected ? 'none' : '1.5px solid #D1D5DB',
            }}
          >
            {isSelected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}

        {/* Admin: status badge */}
        {isAdmin && !multiSelectMode && product.product_status !== ProductStatus.Disponible && (
          <span
            className="absolute bottom-1.5 left-1.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
          >
            {formatProductStatus(product.product_status)}
          </span>
        )}
      </button>

      {/* Info */}
      <div className="px-2.5 pt-2 pb-2.5 flex flex-col gap-1 flex-1">
        <button onClick={handleMainClick} className="text-left">
          <p
            className="font-semibold text-[12px] leading-tight line-clamp-2"
            style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
          >
            {product.name}
          </p>
        </button>

        <p
          className="font-bold text-[12px] mt-auto"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          {formatAmount(price, country)}
        </p>

        {/* Add button */}
        {!multiSelectMode && (
          BLOCKED_STATUSES.has(product.product_status as ProductStatus) ? (
            <button
              disabled
              className="w-full mt-0.5 py-1.5 rounded-full flex items-center justify-center gap-1 opacity-40 cursor-not-allowed"
              style={{ background: '#9CA3AF' }}
            >
              <span
                className="text-[10px] font-semibold text-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {formatProductStatus(product.product_status)}
              </span>
            </button>
          ) : product.product_status === ProductStatus.Privado ? (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect() }}
              className="w-full mt-0.5 py-1.5 rounded-full flex items-center justify-center gap-1 active:scale-95 transition-transform"
              style={{ background: '#7C3AED' }}
            >
              <span
                className="text-[10px] font-semibold text-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Privado
              </span>
            </button>
          ) : qty === 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (product.is_kit) {
                  onSelect()
                } else {
                  const result = add(product)
                  if (!result.ok) {
                    if (result.reason === 'kit_limit') toast.error('Solo puedes agregar 1 kit al carrito')
                    else if (result.reason === 'no_stock') toast.error('Producto sin stock disponible')
                    else toast.error('Has alcanzado el máximo disponible en stock')
                  }
                }
              }}
              className="w-full mt-0.5 py-1.5 rounded-full flex items-center justify-center gap-1 active:scale-95 transition-transform"
              style={{ background: '#062A63' }}
            >
              <Plus size={12} color="#fff" />
              <span
                className="text-[10px] font-semibold text-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {product.is_kit ? 'Ver kit' : 'Agregar'}
              </span>
            </button>
          ) : (
            <div className="flex items-center justify-between mt-0.5">
              <button
                onClick={(e) => { e.stopPropagation(); decrement(product.code) }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: '#F2F4F9', color: '#062A63' }}
              >
                −
              </button>
              <span
                className="text-xs font-bold"
                style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
              >
                {qty}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); const r = increment(product.code); if (!r.ok) toast.error('Has alcanzado el máximo disponible en stock') }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: '#062A63', color: '#fff' }}
              >
                +
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}

// ── GridProductCard (category sections) ──────────────────────────────────────

function GridProductCard({
  product,
  country,
  membership,
  isAdmin,
  isSelected,
  multiSelectMode,
  onSelect,
  onToggle,
}: CardProps) {
  const [imgError, setImgError] = useState(false)
  const { add, items, increment, decrement } = useCart()
  const cartItem = items.find((i) => i.product.code === product.code)
  const qty = cartItem?.quantity ?? 0
  const price = getProductPrice(product, country, membership)

  function handleMainClick() {
    if (multiSelectMode) {
      onToggle()
    } else {
      onSelect()
    }
  }

  return (
    <div
      className="rounded-[28px] overflow-hidden flex flex-col relative active:scale-[0.97] transition-transform"
      style={{
        background: '#fff',
        boxShadow: '0 2px 12px rgba(6,42,99,0.07)',
        border: isSelected ? '2px solid #062A63' : '2px solid transparent',
      }}
    >
      {/* Image */}
      <button
        className="w-full relative overflow-hidden"
        style={{ height: 140, background: '#F2F4F9' }}
        onClick={handleMainClick}
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
            <ShoppingBag size={36} style={{ color: '#D1D5DB' }} />
          </div>
        )}

        {/* Status ribbon */}
        <StatusRibbon status={product.product_status} />

        {/* PV badge */}
        <span
          className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(12,188,229,0.15)', color: '#0CBCE5' }}
        >
          {product.pv} PV
        </span>

        {/* Admin: selection checkbox */}
        {isAdmin && multiSelectMode && (
          <div
            className="absolute top-2 left-2 w-5 h-5 rounded-md flex items-center justify-center"
            style={{
              background: isSelected ? '#062A63' : 'rgba(255,255,255,0.9)',
              border: isSelected ? 'none' : '1.5px solid #D1D5DB',
            }}
          >
            {isSelected && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        )}

        {/* Admin: status badge */}
        {isAdmin && !multiSelectMode && product.product_status !== ProductStatus.Disponible && (
          <span
            className="absolute bottom-2 left-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
          >
            {formatProductStatus(product.product_status)}
          </span>
        )}
      </button>

      {/* Info */}
      <div className="px-3 pt-2 pb-3 flex flex-col gap-1 flex-1">
        <button onClick={handleMainClick} className="text-left">
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
          {formatAmount(price, country)}
        </p>

        {/* Add button */}
        {!multiSelectMode && (
          BLOCKED_STATUSES.has(product.product_status as ProductStatus) ? (
            <button
              disabled
              className="w-full mt-1 py-2 rounded-full flex items-center justify-center gap-1.5 opacity-40 cursor-not-allowed"
              style={{ background: '#9CA3AF' }}
            >
              <span
                className="text-xs font-semibold text-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {formatProductStatus(product.product_status)}
              </span>
            </button>
          ) : product.product_status === ProductStatus.Privado ? (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect() }}
              className="w-full mt-1 py-2 rounded-full flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              style={{ background: '#7C3AED' }}
            >
              <span
                className="text-xs font-semibold text-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Privado
              </span>
            </button>
          ) : qty === 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (product.is_kit) {
                  onSelect()
                } else {
                  const result = add(product)
                  if (!result.ok) {
                    if (result.reason === 'kit_limit') toast.error('Solo puedes agregar 1 kit al carrito')
                    else if (result.reason === 'no_stock') toast.error('Producto sin stock disponible')
                    else toast.error('Has alcanzado el máximo disponible en stock')
                  }
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
                {product.is_kit ? 'Ver kit' : 'Agregar'}
              </span>
            </button>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); decrement(product.code) }}
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
                onClick={(e) => { e.stopPropagation(); const r = increment(product.code); if (!r.ok) toast.error('Has alcanzado el máximo disponible en stock') }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold active:scale-95"
                style={{ background: '#062A63', color: '#fff' }}
              >
                +
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
