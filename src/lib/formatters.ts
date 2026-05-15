// Order status enum + label map
export enum OrderStatus {
  Pending = 'pending',
  Paid = 'paid',
  EnProceso = 'en_proceso',
  Cancelled = 'cancelled',
  Reembolsado = 'reembolsado',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'Pendiente',
  [OrderStatus.Paid]: 'Completo',
  [OrderStatus.EnProceso]: 'En proceso',
  [OrderStatus.Cancelled]: 'Cancelado',
  [OrderStatus.Reembolsado]: 'Reembolsado',
}

// Payment method enum + label map
export enum PaymentMethod {
  Card = 'card',
  Cash = 'cash',
  Transfer = 'transfer',
  Wallet = 'wallet',
  Admin = 'admin',
  AdminSet = 'admin_set',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: 'Tarjeta de débito/crédito',
  cash: 'Efectivo',
  transfer: 'Transferencia',
  wallet: 'Billetera',
  admin: 'Administrador',
  admin_set: 'Admin set',
}

// Shipping method types and formatter
export type ShippingData =
  | { type: 'cedi'; cedi_id: string }
  | { type: 'domicilio'; direccion_id: string }
  | null

export function formatShippingMethod(shippingData: ShippingData, cediName?: string): string {
  if (!shippingData) return '—'
  if (shippingData.type === 'domicilio') return 'Envío a domicilio'
  if (shippingData.type === 'cedi') return cediName ? `CEDI: ${cediName}` : 'CEDI: —'
  return 'Desconocido'
}

export function formatOrderStatus(status: string | null | undefined): string {
  if (!status) return '—'
  return ORDER_STATUS_LABELS[status as OrderStatus] ?? status
}

export function formatPaymentMethod(method: string | null | undefined): string {
  if (!method) return 'Sin método'
  return PAYMENT_METHOD_LABELS[method] ?? method
}

// Currency formatter
export type OrderCountry = 'MXN' | 'USD' | 'COP' | 'EUR'

const CURRENCY_MAP: Record<string, string> = {
  MXN: 'MXN',
  USD: 'USD',
  COP: 'COP',
  EUR: 'EUR',
}

export function formatAmount(amount: number, country?: string | null): string {
  const currency = CURRENCY_MAP[country ?? ''] ?? 'MXN'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCurrency(amount: number, currencyCode: string = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Bono type labels
export const BONO_TYPE_LABELS: Record<string, string> = {
  patrocinio: 'Patrocinio',
  uninivel: 'Uninivel',
  match: 'Match',
  promotor: 'Promotor',
  fidelidad: 'Fidelidad',
  infinito_patrocinio: 'Infinito Patrocinio',
  infinito_uninivel: 'Infinito Uninivel',
}

export function formatBonoType(type: string): string {
  return BONO_TYPE_LABELS[type] ?? type
}

// Product status enum + label map
export enum ProductStatus {
  Disponible = 'disponible',
  Proximamente = 'proximamente',
  NoDisponible = 'no_disponible',
  Agotado = 'agotado',
  Privado = 'privado',
  Protegido = 'protegido',
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  [ProductStatus.Disponible]: 'Disponible',
  [ProductStatus.Proximamente]: 'Próximamente',
  [ProductStatus.NoDisponible]: 'No disponible',
  [ProductStatus.Agotado]: 'Agotado',
  [ProductStatus.Privado]: 'Privado',
  [ProductStatus.Protegido]: 'Protegido',
}

export function formatProductStatus(status: string): string {
  return PRODUCT_STATUS_LABELS[status as ProductStatus] ?? status
}

// Date formatter
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}
