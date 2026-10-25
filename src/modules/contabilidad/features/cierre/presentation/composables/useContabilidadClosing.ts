import { contabilidadClosingRepositoryKey as closingRepositoryKey } from '../../application/ports/contabilidad-closing.port'
import { useService } from '@shared/presentation/di/services'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
export const contabilidadClosingKeys = {
  root: ['contabilidad-closing'] as const,
  preview: (periodId?: string) => [...contabilidadClosingKeys.root, 'preview', periodId] as const,
}

export function useContabilidadClosingPreview(periodId: Ref<string | undefined>) {
  const closingRepository = useService(closingRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadClosingKeys.preview(periodId.value)),
    queryFn: () => closingRepository.getPreview(periodId.value!),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 5_000,
  })
}

export function useContabilidadClosePeriod() {
  const closingRepository = useService(closingRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (periodId: string) => closingRepository.closePeriod(periodId),
    onSuccess: async () => {
      await invalidateModuleQueries(qc, 'contabilidad')
      void markapAlert.toast.success('Periodo cerrado correctamente.')
    },
    onError: (e) =>
      void markapAlert.toast.error('No se pudo cerrar el periodo', getApiErrorMessage(e)),
  })
}
