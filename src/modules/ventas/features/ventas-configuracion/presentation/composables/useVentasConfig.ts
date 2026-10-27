import { ventasConfigRepositoryKey } from '../../application/ports/ventas-config.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@shared/utils/invalidateQuerySubtree'
import {
  PIPELINE_STAGE_OPTIONS,
  pipelineStageLabel,
} from '../../../ventas-sales/domain/pipeline.constants'
import type { VentasPipelineStageDTO } from '../../domain/config.types'
export const ventasConfigKeys = {
  root: ['ventas-config'] as const,
  bootstrap: () => [...ventasConfigKeys.root, 'bootstrap'] as const,
  financingChannels: () => [...ventasConfigKeys.root, 'financing-channels'] as const,
}

export function invalidateVentasConfigCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, ventasConfigKeys.root)
}

export function useVentasConfigBootstrap() {
  const ventasConfigRepository = useService(ventasConfigRepositoryKey)
  return useQuery({
    queryKey: ventasConfigKeys.bootstrap(),
    queryFn: () => ventasConfigRepository.bootstrap(),
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
  const ventasConfigRepository = useService(ventasConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (stages: VentasPipelineStageDTO[]) =>
      ventasConfigRepository.replacePipelineStages(stages),
    onSuccess: () => {
      void invalidateVentasConfigCache(qc)
      void invalidateQuerySubtree(qc, ['ventas-sales'])
      void markapAlert.toast.success('Pipeline actualizado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

/** Catálogo de bancos y medios de pago (incluye inactivos) */
export function useVentasFinancingChannelsCatalog() {
  const ventasConfigRepository = useService(ventasConfigRepositoryKey)
  return useQuery({
    queryKey: ventasConfigKeys.financingChannels(),
    queryFn: () => ventasConfigRepository.listFinancingChannels(),
  })
}

/** Al cambiar el catálogo se refresca también el selector del proceso de venta */
function invalidateChannels(qc: QueryClient) {
  void invalidateVentasConfigCache(qc)
  void invalidateQuerySubtree(qc, ['ventas-sales'])
}

export function useVentasCreateFinancingChannel() {
  const ventasConfigRepository = useService(ventasConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ventasConfigRepository.createFinancingChannel,
    onSuccess: (row) => {
      invalidateChannels(qc)
      void markapAlert.toast.success(`«${row.name}» agregado`)
    },
    onError: (e) => void markapAlert.toast.error('No se pudo agregar', getApiErrorMessage(e)),
  })
}

export function useVentasUpdateFinancingChannel() {
  const ventasConfigRepository = useService(ventasConfigRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof ventasConfigRepository.updateFinancingChannel>[1]) =>
      ventasConfigRepository.updateFinancingChannel(id, body),
    onSuccess: () => {
      invalidateChannels(qc)
      void markapAlert.toast.success('Catálogo actualizado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}
