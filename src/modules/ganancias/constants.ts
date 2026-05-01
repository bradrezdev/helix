// ─── Ganancias Constants ──────────────────────────────────────────────────────
// Color palette and icon mapping for each bonus type.
// Each bono_type gets a distinct accent color and Lucide icon for visual identity.

import {
  DollarSign,
  Network,
  Users,
  TrendingUp,
  Rocket,
  Crown,
  Gift,
  type LucideIcon,
} from 'lucide-react'

/**
 * Accent colors used as the left accent bar in BonoCard.
 * Keyed by bono_type with 'default' as fallback for unknown types.
 */
export const GANANCIAS_BONO_COLORS: Record<string, string> = {
  unilevel: '#0CBCE5',
  binario: '#8B5CF6',
  matching: '#10B981',
  fast_start: '#F59E0B',
  liderazgo: '#062A63',
  residual: '#EC4899',
  default: '#6B7280',
}

/**
 * Lucide icons for each bonus type. Used in BonoCard header.
 * Keyed by bono_type with 'default' as fallback.
 */
export const GANANCIAS_BONO_ICONS: Record<string, LucideIcon> = {
  unilevel: Network,
  binario: Users,
  matching: TrendingUp,
  fast_start: Rocket,
  liderazgo: Crown,
  residual: Gift,
  default: DollarSign,
}

/** Safe color lookup with fallback. */
export function getBonoColor(key: string): string {
  return GANANCIAS_BONO_COLORS[key] ?? GANANCIAS_BONO_COLORS['default']
}

/** Safe icon lookup with fallback. */
export function getBonoIcon(key: string): LucideIcon {
  return GANANCIAS_BONO_ICONS[key] ?? GANANCIAS_BONO_ICONS['default']
}
