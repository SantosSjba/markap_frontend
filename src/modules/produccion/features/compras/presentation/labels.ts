export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

import { formatDate as formatCalendarDate } from '@/shared/utils/formatters'

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return formatCalendarDate(iso, { day: 'numeric', month: 'short', year: 'numeric' })
}

export const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  PARTIAL: 'Recibida parcial',
  RECEIVED: 'Recibida',
  CANCELLED: 'Cancelada',
}

export const PO_STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'SENT', label: 'Enviada' },
  { value: 'PARTIAL', label: 'Recibida parcial' },
  { value: 'RECEIVED', label: 'Recibida' },
  { value: 'CANCELLED', label: 'Cancelada' },
] as const

export function poStatusClass(status: string): string {
  if (status === 'DRAFT') return 'text-slate-600'
  if (status === 'SENT') return 'text-blue-600'
  if (status === 'PARTIAL') return 'text-amber-600'
  if (status === 'RECEIVED') return 'text-emerald-600'
  if (status === 'CANCELLED') return 'text-red-600'
  return ''
}
