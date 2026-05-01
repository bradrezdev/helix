import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Zustand store for sidebar and navigation layout state.
 * Persisted to localStorage so layout preferences survive page reloads.
 */
interface LayoutState {
  /** Whether the main sidebar is collapsed to icon-only mode */
  sidebarCollapsed: boolean
  /** Whether the "Negocio" submenu in the sidebar is expanded */
  negocioExpanded: boolean
  /** Toggle sidebar collapsed state */
  toggleSidebar: () => void
  /** Explicitly set sidebar collapsed state */
  setSidebarCollapsed: (v: boolean) => void
  /** Toggle Negocio submenu expanded state */
  toggleNegocio: () => void
  /** Explicitly set Negocio submenu expanded state */
  setNegocioExpanded: (v: boolean) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      negocioExpanded: false,

      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      toggleNegocio: () =>
        set((s) => ({ negocioExpanded: !s.negocioExpanded })),

      setNegocioExpanded: (v) => set({ negocioExpanded: v }),
    }),
    { name: 'helix-layout' }
  )
)
