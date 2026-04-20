import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { markapAlert } from '@/shared/alert'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import { PIPELINE_STAGE_OPTIONS, pipelineStageLabel } from '@ventas/sales'
import type { VentasPipelineStageDTO } from '../domain/config.types'
import { ventasConfigService } from '../infrastructure/ventasConfig.service'

export const ventasConfigKeys = {
  root: ['ventas-config'] as const,
  bootstrap: () => [...ventasConfigKeys.root, 'bootstrap'] as const,
}

export function invalidateVentasConfigCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, ventasConfigKeys.root)
}

export function useVentasConfigBootstrap() {
  return useQuery({
    queryKey: ventasConfigKeys.bootstrap(),
    queryFn: () => ventasConfigService.bootstrap(),
    staleTime: 30_000,
  })
}

/** Etiquetas y orden del pipeline (fallback a constantes si aún no hay bootstrap). */
export function useVentasPipelineStages() {
  const q = useVentasConfigBootstrap()
  const stageOptions = computed(() => {
    const rows = q.data.value?.pipelineStages
    if (!rows?.length) {
      return PIPELINE_STAGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))
    }
    return [...rows]
      .filter((s) => s.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({ value: s.code, label: s.label }))
  })
  const orderedCodes = computed(() => stageOptions.value.map((o) => o.value))
  function labelFor(code: string) {
    return stageOptions.value.find((o) => o.value === code)?.label ?? pipelineStageLabel(code)
  }
  return {
    query: q,
    stageOptions,
    orderedCodes,
    labelFor,
  }
}

export function useVentasSavePipelineStages() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stages: VentasPipelineStageDTO[]) => ventasConfigService.replacePipelineStages(stages),
    onSuccess: () => {
      void invalidateVentasConfigCache(qc)
      void invalidateQuerySubtree(qc, ['ventas-sales'])
      void markapAlert.toast.success('Pipeline actualizado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useVentasSaveNumbering() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { prefix?: string; lastNumber?: number }) =>
      ventasConfigService.patchSaleProcessNumbering(body),
    onSuccess: () => {
      void invalidateVentasConfigCache(qc)
      void markapAlert.toast.success('Numeración actualizada')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}
