/** Tipos de actividad CRM (API en inglés, UI en español) */
export const ACTIVITY_TYPE_OPTIONS = [
  { value: 'CALL', label: 'Llamada' },
  { value: 'VISIT', label: 'Visita' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'TASK', label: 'Tarea' },
  { value: 'OTHER', label: 'Otro' },
] as const

export type ActivityTypeCode = (typeof ACTIVITY_TYPE_OPTIONS)[number]['value']
