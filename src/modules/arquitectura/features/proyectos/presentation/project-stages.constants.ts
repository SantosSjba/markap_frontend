import type { ArquitecturaProjectLifecycleStatus, ArquitecturaProjectStatus } from '../domain/project.types'

export const ARQUITECTURA_PROJECT_LIFECYCLE_LABELS: Record<ArquitecturaProjectLifecycleStatus, string> = {
  DESIGN: 'Anteproyecto',
  QUOTE: 'Cotización',
  APPROVED: 'Aprobación',
  IN_PROGRESS: 'Obra',
  FINISHED: 'Finalizado',
}

export const ARQUITECTURA_PROJECT_LIFECYCLE_CODES = Object.keys(
  ARQUITECTURA_PROJECT_LIFECYCLE_LABELS,
) as ArquitecturaProjectLifecycleStatus[]

export const ARQUITECTURA_PROJECT_STATUS_LABELS: Record<ArquitecturaProjectStatus, string> = {
  ...ARQUITECTURA_PROJECT_LIFECYCLE_LABELS,
  CANCELLED: 'Cancelado',
}

export function isArquitecturaProjectLifecycleStatus(
  code: string,
): code is ArquitecturaProjectLifecycleStatus {
  return (ARQUITECTURA_PROJECT_LIFECYCLE_CODES as string[]).includes(code)
}
