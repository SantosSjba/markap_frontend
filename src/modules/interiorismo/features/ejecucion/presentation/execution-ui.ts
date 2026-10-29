/** Orden y colores compartidos por las vistas de Ejecución. */

export const KANBAN_ORDER = ['BACKLOG', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const

type Variant = 'primary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export const TASK_STATUS_VARIANT: Record<string, Variant> = {
  BACKLOG: 'neutral',
  IN_PROGRESS: 'info',
  BLOCKED: 'error',
  DONE: 'success',
}

/** Color de la barra del Gantt por estado. */
export const TASK_STATUS_BAR: Record<string, string> = {
  BACKLOG: 'bg-gray-400 dark:bg-gray-600',
  IN_PROGRESS: 'bg-blue-light-500',
  BLOCKED: 'bg-error-500',
  DONE: 'bg-success-500',
}

export const SEVERITY_VARIANT: Record<string, Variant> = { LOW: 'neutral', MEDIUM: 'warning', HIGH: 'error' }
export const INCIDENT_STATUS_VARIANT: Record<string, Variant> = { OPEN: 'error', IN_PROGRESS: 'warning', CLOSED: 'success' }
