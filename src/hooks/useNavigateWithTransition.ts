import { useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { NavigateOptions } from '@tanstack/react-router'
import type { RegisteredRouter } from '@tanstack/react-router'

/**
 * Wraps TanStack Router's `useNavigate()` with the View Transitions API.
 *
 * Performs a crossfade animation during SPA navigation in supporting browsers
 * (Chromium-based). Falls back to instant navigation in browsers that lack
 * `document.startViewTransition` (Firefox, Safari).
 *
 * @returns A stable callback that accepts the same options as `navigate()`.
 */
export function useNavigateWithTransition(): (
  opts: NavigateOptions<RegisteredRouter, string, string | undefined>
) => void {
  const navigate = useNavigate()

  const navigateWithTransition = useCallback(
    (opts: NavigateOptions<RegisteredRouter, string, string | undefined>) => {
      if ('startViewTransition' in document) {
        document.startViewTransition(() => {
          navigate(opts)
        })
      } else {
        navigate(opts)
      }
    },
    [navigate],
  )

  return navigateWithTransition
}
