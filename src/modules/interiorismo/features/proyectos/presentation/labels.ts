import type { InteriorProjectStatus, InteriorProjectType } from '../domain/project.types'

export const PROJECT_TYPE_LABELS: Record<InteriorProjectType, string> = {
  REMODELING: 'Remodelación',
  INTERIOR_DESIGN: 'Diseño interior',
  IMPLEMENTATION: 'Implementación',
  FURNITURE: 'Mobiliario',
}

export const PROJECT_STATUS_LABELS: Record<InteriorProjectStatus, string> = {
  PROSPECT: 'Prospecto',
  DESIGN: 'Diseño',
  QUOTE: 'Cotización',
  APPROVED: 'Aprobado',
  IN_PROGRESS: 'En ejecución',
  FINISHED: 'Finalizado',
  CANCELLED: 'Cancelado',
}

export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
