/** Etapas del proceso de venta (API = código, UI = español) — orden del pipeline Kanban */
export const PIPELINE_STAGE_OPTIONS = [
  { value: 'SEPARATION', label: 'Separación' },
  { value: 'ARRAS', label: 'Contrato de arras' },
  { value: 'MINUTA', label: 'Minuta' },
  { value: 'PUBLIC_DEED', label: 'Escritura pública' },
] as const

export type PipelineStageValue = (typeof PIPELINE_STAGE_OPTIONS)[number]['value']

const PIPELINE_STAGE_SET = new Set<string>(PIPELINE_STAGE_OPTIONS.map((o) => o.value))

export function normalizePipelineStage(code: string | null | undefined): PipelineStageValue {
  if (code && PIPELINE_STAGE_SET.has(code)) return code as PipelineStageValue
  return 'SEPARATION'
}

export function pipelineStageLabel(code: string): string {
  return PIPELINE_STAGE_OPTIONS.find((o) => o.value === code)?.label ?? code
}

/** Icono y color por etapa (Kanban / pipeline visual) */
export const PIPELINE_STAGE_META: Record<PipelineStageValue, { icon: string; color: string }> = {
  SEPARATION: { icon: 'lucide:bookmark', color: '#ca8a04' },
  ARRAS: { icon: 'lucide:file-signature', color: '#2563eb' },
  MINUTA: { icon: 'lucide:file-text', color: '#7c3aed' },
  PUBLIC_DEED: { icon: 'lucide:landmark', color: '#16a34a' },
}

export function pipelineStageMeta(code: string | null | undefined) {
  const key = normalizePipelineStage(code)
  return (
    PIPELINE_STAGE_META[key] ?? {
      icon: 'lucide:circle-dot',
      color: 'var(--color-primary)',
    }
  )
}

/** Activo en curso (azul), ganado (verde), caído (rojo) */
export function processStatusBadgeVariant(status: string): 'success' | 'info' | 'neutral' | 'error' {
  if (status === 'ACTIVE') return 'info'
  if (status === 'WON') return 'success'
  if (status === 'LOST') return 'error'
  return 'neutral'
}

export const PROCESS_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'WON', label: 'Ganado' },
  { value: 'LOST', label: 'Perdido' },
] as const

export function processStatusLabel(code: string): string {
  return PROCESS_STATUS_OPTIONS.find((o) => o.value === code)?.label ?? code
}

export function pipelineStageIndexIn(code: string, orderedCodes: readonly string[]): number {
  const key = normalizePipelineStage(code)
  const idx = orderedCodes.indexOf(key)
  return idx >= 0 ? idx : 0
}

/**
 * Movimiento entre etapas de un proceso activo: se avanza de una en una (con el documento de la
 * etapa cargado en Cumplimiento legal) y se puede retroceder indicando el motivo.
 */
export type StageMove = 'same' | 'next' | 'skip' | 'backward'

export function classifyStageMove(fromStage: string, toStage: string, orderedCodes: readonly string[]): StageMove {
  const from = pipelineStageIndexIn(fromStage, orderedCodes)
  const to = pipelineStageIndexIn(toStage, orderedCodes)
  if (from === to) return 'same'
  if (to < from) return 'backward'
  return to - from === 1 ? 'next' : 'skip'
}

/** Etapas elegibles desde la actual: las anteriores (con motivo), la actual y la siguiente */
export function allowedStageOptions(
  currentStage: string,
  options: readonly { value: string; label: string }[],
  orderedCodes: readonly string[],
): { value: string; label: string }[] {
  return options.filter((o) => classifyStageMove(currentStage, o.value, orderedCodes) !== 'skip')
}

/** Documento de Cumplimiento legal que exige cada etapa (mismo criterio que el servidor) */
export const STAGE_REQUIRED_DOCUMENT: Readonly<Record<string, { docType: string; label: string }>> = {
  ARRAS: { docType: 'ARRAS', label: 'contrato de arras' },
  MINUTA: { docType: 'MINUTA', label: 'minuta' },
  PUBLIC_DEED: { docType: 'ESCRITURA_PUBLICA', label: 'escritura pública' },
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

/** Documentos de Cumplimiento legal (docType) */
export const COMPLIANCE_DOCUMENT_OPTIONS = [
  { value: 'CRI', label: 'CRI' },
  { value: 'ARRAS', label: 'Contrato de arras' },
  { value: 'MINUTA', label: 'Minuta' },
  { value: 'ESCRITURA_PUBLICA', label: 'Escritura pública' },
  { value: 'ALCABALA', label: 'Pago alcabala' },
  { value: 'RENTA2', label: 'Pago renta 2da' },
  { value: 'KYC', label: 'KYC/LAFT' },
  { value: 'OTRO', label: 'Otro' },
]

export const complianceDocumentLabel = (docType: string) =>
  COMPLIANCE_DOCUMENT_OPTIONS.find((o) => o.value === docType)?.label ?? docType
