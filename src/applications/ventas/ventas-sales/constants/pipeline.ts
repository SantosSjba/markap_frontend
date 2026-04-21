/** Etapas CRM Ventas (API = inglés, UI = español) — orden del pipeline Kanban */
export const PIPELINE_STAGE_OPTIONS = [
  { value: 'PROSPECT', label: 'Prospecto' },
  { value: 'VISIT', label: 'Visita' },
  { value: 'NEGOTIATION', label: 'Negociación' },
  { value: 'SEPARATION', label: 'Separación' },
  { value: 'CLOSING', label: 'Cierre' },
] as const

export type PipelineStageValue = (typeof PIPELINE_STAGE_OPTIONS)[number]['value']

const PIPELINE_STAGE_SET = new Set<string>(PIPELINE_STAGE_OPTIONS.map((o) => o.value))

export function normalizePipelineStage(code: string | null | undefined): PipelineStageValue {
  if (code && PIPELINE_STAGE_SET.has(code)) return code as PipelineStageValue
  return 'PROSPECT'
}

export function pipelineStageLabel(code: string): string {
  return PIPELINE_STAGE_OPTIONS.find((o) => o.value === code)?.label ?? code
}

export const PROCESS_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'WON', label: 'Ganado' },
  { value: 'LOST', label: 'Perdido' },
] as const

export function processStatusLabel(code: string): string {
  return PROCESS_STATUS_OPTIONS.find((o) => o.value === code)?.label ?? code
}

export const SEPARATION_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Activa' },
  { value: 'EXPIRED', label: 'Vencida' },
  { value: 'CLOSED', label: 'Cerrada' },
] as const

export function separationStatusLabel(code: string): string {
  return SEPARATION_STATUS_OPTIONS.find((o) => o.value === code)?.label ?? code
}

export const PAYMENT_TYPE_OPTIONS = [
  { value: 'CASH', label: 'Contado' },
  { value: 'CREDIT', label: 'Crédito' },
] as const
