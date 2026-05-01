import { useState, useEffect } from 'react'

/**
 * Detects whether a CSS media query currently matches.
 * Uses window.matchMedia under the hood with live 'change' event tracking.
 * Falls back to false during SSR (window undefined).
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mq = window.matchMedia(query)

    // Sync immediately in case the lazy initializer was stale
    setMatches(mq.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    mq.addEventListener('change', handleChange)
    return () => mq.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/** Tailwind md: breakpoint (768px). True when viewport is ≥768px wide. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)')
}
