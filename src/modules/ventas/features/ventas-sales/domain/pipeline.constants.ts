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
export const PIPELINE_STAGE_META: Record<
  PipelineStageValue,
  { icon: string; color: string }
> = {
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

export function processStatusBadgeVariant(
  status: string,
): 'success' | 'neutral' | 'error' {
  if (status === 'ACTIVE') return 'success'
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

export function pipelineStageIndexIn(
  code: string,
  orderedCodes: readonly string[],
): number {
  const key = normalizePipelineStage(code)
  const idx = orderedCodes.indexOf(key)
  return idx >= 0 ? idx : 0
}

/** Solo avance o permanecer en la misma etapa (procesos activos). */
export function isForwardPipelineTransition(
  fromStage: string,
  toStage: string,
  orderedCodes: readonly string[],
): boolean {
  const from = normalizePipelineStage(fromStage)
  const to = normalizePipelineStage(toStage)
  if (from === to) return true
  return pipelineStageIndexIn(to, orderedCodes) >= pipelineStageIndexIn(from, orderedCodes)
}

export function allowedForwardStageOptions(
  currentStage: string,
  options: readonly { value: string; label: string }[],
  orderedCodes: readonly string[],
): { value: string; label: string }[] {
  const curIdx = pipelineStageIndexIn(currentStage, orderedCodes)
  return options.filter((o) => pipelineStageIndexIn(o.value, orderedCodes) >= curIdx)
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
