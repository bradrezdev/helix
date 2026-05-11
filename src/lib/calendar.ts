// ─── Calendar Utils ────────────────────────────────────────────────────────────
// Diccionario mes:días y utilidades de período.

/** Días por mes (año no bisiesto base — para bisiestos ajustar febrero con getDaysInMonth) */
export const DAYS_IN_MONTH: Record<number, number> = {
  1: 31, 2: 28, 3: 31, 4: 30,
  5: 31, 6: 30, 7: 31, 8: 31,
  9: 30, 10: 31, 11: 30, 12: 31,
}

export const MONTH_LABELS_ES: Record<number, string> = {
  1: 'Ene', 2: 'Feb', 3: 'Mar', 4: 'Abr',
  5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Ago',
  9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dic',
}

export const MONTH_FULL_ES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
}

/** Returns actual days in month, accounting for leap years */
export function getDaysInMonth(month: number, year: number): number {
  if (month === 2) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
    return isLeap ? 29 : 28
  }
  return DAYS_IN_MONTH[month] ?? 30
}

/** Returns array of last N months as { month, year, label } — oldest first */
export function getLastNMonths(n: number): Array<{ month: number; year: number; label: string }> {
  const result = []
  const now = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    result.push({
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      label: MONTH_LABELS_ES[d.getMonth() + 1] ?? String(d.getMonth() + 1),
    })
  }
  return result.reverse()
}
