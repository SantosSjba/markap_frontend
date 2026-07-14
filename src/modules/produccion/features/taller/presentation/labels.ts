export const WO_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En proceso',
  COMPLETED: 'Terminada',
  CANCELLED: 'Cancelada',
}

export const WO_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
}

export const STAGE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En curso',
  DONE: 'Completada',
}

export const PRODUCCION_STAGES = [
  { key: 'planificacion', label: 'Planificación' },
  { key: 'corte', label: 'Corte' },
  { key: 'ensamble', label: 'Ensamble' },
  { key: 'acabados', label: 'Acabados' },
] as const

import { formatDate as formatCalendarDate } from '@/shared/utils/formatters'

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return formatCalendarDate(iso, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function woStatusClass(status: string): string {
  if (status === 'PENDING') return 'text-slate-600'
  if (status === 'IN_PROGRESS') return 'text-blue-600'
  if (status === 'COMPLETED') return 'text-emerald-600'
  if (status === 'CANCELLED') return 'text-red-600'
  return ''
}

export function priorityClass(p: string): string {
  if (p === 'URGENT' || p === 'HIGH') return 'text-red-600 font-semibold'
  if (p === 'LOW') return 'text-slate-500'
  return ''
}
