import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type { UpsertContabilidadIncomeTaxPeriodBody } from '../../domain/income-tax.types'
import { incomeTaxRepositoryKey } from '../../application/ports/income-tax.port'
import { useService } from '@shared/presentation/di/services'
export const contabilidadIncomeTaxKeys = {
  root: ['contabilidad-income-tax'] as const,
  detail: (periodId?: string) => [...contabilidadIncomeTaxKeys.root, 'detail', periodId] as const,
}

export function invalidateContabilidadIncomeTaxCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'contabilidad')
}

export function useContabilidadIncomeTaxDetail(periodId: Ref<string | undefined>) {
  const repository = useService(incomeTaxRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadIncomeTaxKeys.detail(periodId.value)),
    queryFn: () => repository.detail(periodId.value!),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 15_000,
  })
}

export function useContabilidadUpsertIncomeTaxPeriod() {
  const repository = useService(incomeTaxRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      periodId,
      body,
    }: {
      periodId: string
      body: UpsertContabilidadIncomeTaxPeriodBody
    }) => repository.save(periodId, body),
    onSuccess: async () => {
      await invalidateContabilidadIncomeTaxCache(qc)
      await invalidateModuleQueries(qc, 'contabilidad')
      void markapAlert.toast.success('Borrador IR guardado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}

export function useContabilidadIncomeTaxExport() {
  const repository = useService(incomeTaxRepositoryKey)
  return (periodId: string) => repository.export(periodId)
}
