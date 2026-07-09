import type { ArquitecturaProjectStatus, ArquitecturaProjectType } from '../domain/project.types'
import {
  ARQUITECTURA_PROJECT_LIFECYCLE_CODES,
  ARQUITECTURA_PROJECT_STATUS_LABELS,
} from './project-stages.constants'

export const PROJECT_TYPE_LABELS: Record<ArquitecturaProjectType, string> = {
  RESIDENTIAL: 'Residencial',
  COMMERCIAL: 'Comercial',
  INSTITUTIONAL: 'Institucional',
  MIXED_USE: 'Uso mixto',
  URBAN: 'Urbano',
}

export const PROJECT_STATUS_LABELS: Record<ArquitecturaProjectStatus, string> =
  ARQUITECTURA_PROJECT_STATUS_LABELS

export { ARQUITECTURA_PROJECT_LIFECYCLE_CODES, ARQUITECTURA_PROJECT_STATUS_LABELS }

export const INTERVENTION_LEVEL_LABELS: Record<string, string> = {
  I: 'Nivel I',
  II: 'Nivel II',
  III: 'Nivel III',
}

export const INTERVENTION_LEVEL_OPTIONS = Object.entries(INTERVENTION_LEVEL_LABELS).map(
  ([value, label]) => ({ value, label }),
)

export const CURRENCY_OPTIONS = [
  { value: 'PEN', label: 'Soles (PEN)' },
  { value: 'USD', label: 'Dólares (USD)' },
]

export function formatSol(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  return `S/ ${Number(amount).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function projectStatusLabel(
  status: ArquitecturaProjectStatus | string,
  stageLabels?: Record<string, string>,
): string {
  if (stageLabels?.[status]) return stageLabels[status]!
  if (status in ARQUITECTURA_PROJECT_STATUS_LABELS) {
    return ARQUITECTURA_PROJECT_STATUS_LABELS[status as ArquitecturaProjectStatus]
  }
  return status
}
