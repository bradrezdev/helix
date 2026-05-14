import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from './hooks/useProducts.ts'

export interface CartItem {
  product: Product
  quantity: number
}

export type AddResult =
  | { ok: true }
  | { ok: false; reason: 'kit_limit' | 'no_stock' | 'stock_exceeded' }

export type IncrementResult =
  | { ok: true }
  | { ok: false; reason: 'stock_exceeded' }

interface CartStore {
  items: CartItem[]
  isKitMode: boolean
  kitType: string | null
  purchaseCompleted: boolean
  showKitFilter: boolean
  add: (product: Product) => AddResult
  remove: (code: string) => void
  increment: (code: string) => IncrementResult
  decrement: (code: string) => void
  clear: () => void
  setKitMode: (isKit: boolean, kitType: string | null) => void
  validateCart: (freshProducts: Product[]) => { removedCodes: string[] }
  total: () => number
  totalPV: () => number
  totalCV: () => number
  count: () => number
  markPurchaseCompleted: () => void
  resetPurchaseFlag: () => void
  setShowKitFilter: (val: boolean) => void
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
  items: [],
  isKitMode: false,
  kitType: null,
  purchaseCompleted: false,
  showKitFilter: false,

  add: (product) => {
    const state = get()
    const existing = state.items.find((i) => i.product.code === product.code)
    const currentQty = existing ? existing.quantity : 0

    if (product.stock <= 0) {
      return { ok: false, reason: 'no_stock' }
    }

    if (product.stock <= currentQty) {
      return { ok: false, reason: 'stock_exceeded' }
    }

    if (state.isKitMode && product.is_kit) {
      const hasKit = state.items.some((i) => i.product.is_kit)
      if (hasKit) {
        return { ok: false, reason: 'kit_limit' }
      }
    }

    if (existing) {
      set((s) => ({
        items: s.items.map((i) =>
          i.product.code === product.code ? { ...i, quantity: i.quantity + 1 } : i
        ),
      }))
    } else {
      set((s) => ({ items: [...s.items, { product, quantity: 1 }] }))
    }
    return { ok: true }
  },

  remove: (code) => {
    const state = get()
    const item = state.items.find((i) => i.product.code === code)
    // In kit mode, removing the kit product clears entire cart
    if (state.isKitMode && item?.product.is_kit) {
      set({ items: [], isKitMode: false, kitType: null })
      return
    }
    set((s) => ({ items: s.items.filter((i) => i.product.code !== code) }))
  },

  increment: (code) => {
    const state = get()
    const item = state.items.find((i) => i.product.code === code)
    if (!item) return { ok: true }
    if (item.product.stock <= item.quantity) return { ok: false, reason: 'stock_exceeded' }
    set((s) => ({
      items: s.items.map((i) =>
        i.product.code === code ? { ...i, quantity: i.quantity + 1 } : i
      ),
    }))
    return { ok: true }
  },

  decrement: (code) => {
    const state = get()
    const item = state.items.find((i) => i.product.code === code)
    // In kit mode, decrement-to-zero on kit item clears entire cart
    if (state.isKitMode && item?.product.is_kit && item.quantity <= 1) {
      set({ items: [], isKitMode: false, kitType: null })
      return
    }
    set((s) => ({
      items: s.items
        .map((i) =>
          i.product.code === code ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0),
    }))
  },

  clear: () => set({ items: [] }),

  setKitMode: (isKit, kitType) =>
    set({ isKitMode: isKit, kitType: isKit ? kitType : null, items: [] }),

  validateCart: (freshProducts) => {
    const state = get()
    const productMap = new Map(freshProducts.map((p) => [p.code, p]))
    const removedCodes: string[] = []
    const validItems: CartItem[] = []

    for (const item of state.items) {
      const fresh = productMap.get(item.product.code)

      if (!fresh || fresh.product_status === 'no_disponible') {
        removedCodes.push(item.product.code)
        continue
      }

      if (fresh.stock <= 0) {
        removedCodes.push(item.product.code)
        continue
      }

      if (fresh.stock < item.quantity) {
        validItems.push({ ...item, product: fresh, quantity: fresh.stock })
        continue
      }

      validItems.push({ ...item, product: fresh })
    }

    const kitItemRemoved =
      state.isKitMode && state.items.some((i) => i.product.is_kit) &&
      !validItems.some((i) => i.product.is_kit)

    if (kitItemRemoved) {
      set({ items: [], isKitMode: false, kitType: null })
    } else {
      set({ items: validItems })
    }

    return { removedCodes }
  },

  total: () =>
    get().items.reduce((sum, i) => sum + (i.product.price_socio_mxn ?? 0) * i.quantity, 0),

  totalPV: () => {
    const state = get()
    if (state.isKitMode) {
      const kitItem = state.items.find((i) => i.product.is_kit)
      if (kitItem) return kitItem.product.pv
    }
    return state.items.reduce((sum, i) => sum + i.product.pv * i.quantity, 0)
  },

  totalCV: () => {
    const state = get()
    if (state.isKitMode) {
      const kitItem = state.items.find((i) => i.product.is_kit)
      if (kitItem) return kitItem.product.cv
    }
    return state.items.reduce((sum, i) => sum + i.product.cv * i.quantity, 0)
  },

  count: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),

  markPurchaseCompleted: () => set({ purchaseCompleted: true }),
  resetPurchaseFlag: () => set({ purchaseCompleted: false }),
  setShowKitFilter: (val) => set({ showKitFilter: val }),
    }),
    { name: 'helix-cart' }
  )
)
