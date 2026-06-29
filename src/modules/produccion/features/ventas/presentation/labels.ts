export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PE', { dateStyle: 'medium' })
}

export const QUOTATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
}

export const QUOTATION_STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'SENT', label: 'Enviada' },
  { value: 'ACCEPTED', label: 'Aceptada' },
  { value: 'REJECTED', label: 'Rechazada' },
] as const

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  IN_PRODUCTION: 'En producción',
  READY: 'Listo',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
}

export const ORDER_STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'IN_PRODUCTION', label: 'En producción' },
  { value: 'READY', label: 'Listo' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
] as const

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programada',
  DELIVERED: 'Entregada',
  CANCELLED: 'Cancelada',
}

export const DELIVERY_STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'SCHEDULED', label: 'Programada' },
  { value: 'DELIVERED', label: 'Entregada' },
  { value: 'CANCELLED', label: 'Cancelada' },
] as const

export function quotationStatusClass(status: string): string {
  if (status === 'DRAFT') return 'text-slate-600'
  if (status === 'SENT') return 'text-blue-600'
  if (status === 'ACCEPTED') return 'text-emerald-600'
  if (status === 'REJECTED') return 'text-red-600'
  return ''
}

export function orderStatusClass(status: string): string {
  if (status === 'PENDING') return 'text-amber-600'
  if (status === 'CONFIRMED') return 'text-blue-600'
  if (status === 'IN_PRODUCTION') return 'text-violet-600'
  if (status === 'READY') return 'text-teal-600'
  if (status === 'DELIVERED') return 'text-emerald-600'
  if (status === 'CANCELLED') return 'text-red-600'
  return ''
}

export function deliveryStatusClass(status: string): string {
  if (status === 'SCHEDULED') return 'text-blue-600'
  if (status === 'DELIVERED') return 'text-emerald-600'
  if (status === 'CANCELLED') return 'text-red-600'
  return ''
}
