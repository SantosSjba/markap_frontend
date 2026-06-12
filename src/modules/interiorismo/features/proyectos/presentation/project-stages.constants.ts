import type { InteriorProjectLifecycleStatus, InteriorProjectStatus } from '../domain/project.types'

/** Etiquetas por defecto del ciclo de 5 estados (si la config aún no cargó). */
export const INTERIOR_PROJECT_LIFECYCLE_LABELS: Record<InteriorProjectLifecycleStatus, string> = {
  DESIGN: 'Diseño',
  QUOTE: 'Cotización',
  APPROVED: 'Aprobación',
  IN_PROGRESS: 'Ejecución',
  FINISHED: 'Finalizado',
}

export const INTERIOR_PROJECT_LIFECYCLE_CODES = Object.keys(
  INTERIOR_PROJECT_LIFECYCLE_LABELS,
) as InteriorProjectLifecycleStatus[]

export const INTERIOR_PROJECT_STATUS_LABELS: Record<InteriorProjectStatus, string> = {
  ...INTERIOR_PROJECT_LIFECYCLE_LABELS,
  CANCELLED: 'Cancelado',
}

export function isInteriorProjectLifecycleStatus(
  code: string,
): code is InteriorProjectLifecycleStatus {
  return (INTERIOR_PROJECT_LIFECYCLE_CODES as string[]).includes(code)
}
