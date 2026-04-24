import { create } from 'zustand'
import type { Product } from '../hooks/useProducts'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  items: CartItem[]
  add: (product: Product) => void
  remove: (code: string) => void
  increment: (code: string) => void
  decrement: (code: string) => void
  clear: () => void
  total: () => number
  totalPV: () => number
  count: () => number
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],

  add: (product) => {
    const existing = get().items.find((i) => i.product.code === product.code)
    if (existing) {
      set((s) => ({
        items: s.items.map((i) =>
          i.product.code === product.code ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }))
    } else {
      set((s) => ({ items: [...s.items, { product, quantity: 1 }] }))
    }
  },

  remove: (code) =>
    set((s) => ({ items: s.items.filter((i) => i.product.code !== code) })),

  increment: (code) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.product.code === code ? { ...i, quantity: i.quantity + 1 } : i
      ),
    })),

  decrement: (code) =>
    set((s) => ({
      items: s.items
        .map((i) =>
          i.product.code === code ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0),
    })),

  clear: () => set({ items: [] }),

  total: () =>
    get().items.reduce((sum, i) => sum + i.product.price_socio_mxn * i.quantity, 0),

  totalPV: () =>
    get().items.reduce((sum, i) => sum + i.product.pv * i.quantity, 0),

  count: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),
}))
