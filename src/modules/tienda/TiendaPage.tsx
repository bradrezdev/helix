import { useState } from 'react'
import { Search } from 'lucide-react'
import { useProducts } from '../../hooks/useProducts'
import { ProductCard } from './ProductCard'
import { ProductSheet } from './ProductSheet'
import type { Product } from '../../hooks/useProducts'

type Category = 'todos' | 'bienestar' | 'nutricion' | 'cuidado'

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'bienestar', label: 'Bienestar' },
  { key: 'nutricion', label: 'Nutrición' },
  { key: 'cuidado', label: 'Cuidado Personal' },
]

function getCategory(product: Product): Category {
  const name = (product.name + ' ' + (product.short_description ?? '')).toLowerCase()
  if (name.includes('cuidado') || name.includes('crema') || name.includes('serum') || name.includes('shampoo') || name.includes('jabon') || name.includes('jabón')) return 'cuidado'
  if (name.includes('nutrici') || name.includes('proteina') || name.includes('proteína') || name.includes('colágeno') || name.includes('colageno') || name.includes('vitamina') || name.includes('suplemento')) return 'nutricion'
  return 'bienestar'
}

export function TiendaPage() {
  const { data: products = [], isLoading, error } = useProducts()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<Category>('todos')

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.short_description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === 'todos' || getCategory(p) === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <main
      className="min-h-screen px-4 pt-8"
      style={{ background: '#F2F4F9', paddingBottom: 'calc(120px + env(safe-area-inset-bottom))' }}
    >
      {/* Header */}
      <div className="mb-5">
        <h1
          className="text-2xl font-bold leading-tight"
          style={{ color: '#062A63', fontFamily: 'Poppins, sans-serif' }}
        >
          Tienda
        </h1>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
          {products.length} productos disponibles
        </p>
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 px-4 py-3 rounded-[32px] mb-5"
        style={{ background: '#fff', boxShadow: '0 1px 4px rgba(6,42,99,0.06)' }}
      >
        <Search size={16} style={{ color: '#9CA3AF' }} />
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: '#383A3F', fontFamily: 'Poppins, sans-serif' }}
        />
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-5">
        {CATEGORIES.map(({ key, label }) => {
          const isActive = activeCategory === key
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: isActive ? '#062A63' : '#fff',
                color: isActive ? '#fff' : '#383A3F',
                border: isActive ? 'none' : '1px solid #EAECF0',
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* States */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-[32px] animate-pulse"
              style={{ height: 260, background: '#E5E7EB' }}
            />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-center mt-8" style={{ color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}>
          Error cargando productos
        </p>
      )}

      {/* Grid */}
      {!isLoading && !error && (
        <>
          {filtered.length === 0 ? (
            <p className="text-sm text-center mt-8" style={{ color: '#9CA3AF', fontFamily: 'Poppins, sans-serif' }}>
              Sin resultados para "{search}"
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((product) => (
                <ProductCard
                  key={product.code}
                  product={product}
                  onOpen={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ProductSheet */}
      {selectedProduct && (
        <ProductSheet
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </main>
  )
}
