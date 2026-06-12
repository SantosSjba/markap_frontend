import type { InteriorProjectStatus, InteriorProjectType } from '../domain/project.types'
import {
  INTERIOR_PROJECT_LIFECYCLE_CODES,
  INTERIOR_PROJECT_STATUS_LABELS,
} from './project-stages.constants'

export const PROJECT_TYPE_LABELS: Record<InteriorProjectType, string> = {
  REMODELING: 'Remodelación',
  INTERIOR_DESIGN: 'Diseño interior',
  IMPLEMENTATION: 'Implementación',
  FURNITURE: 'Mobiliario',
}

/** @deprecated Preferir etiquetas desde configuración (`useInteriorProjectStageOptions`). */
export const PROJECT_STATUS_LABELS: Record<InteriorProjectStatus, string> =
  INTERIOR_PROJECT_STATUS_LABELS

export { INTERIOR_PROJECT_LIFECYCLE_CODES, INTERIOR_PROJECT_STATUS_LABELS }

export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function projectStatusLabel(
  status: InteriorProjectStatus | string,
  stageLabels?: Record<string, string>,
): string {
  if (stageLabels?.[status]) return stageLabels[status]!
  if (status in INTERIOR_PROJECT_STATUS_LABELS) {
    return INTERIOR_PROJECT_STATUS_LABELS[status as InteriorProjectStatus]
  }
  return status
}
