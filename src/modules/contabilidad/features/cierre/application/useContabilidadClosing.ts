import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { contabilidadClosingApiRepository as closingRepository } from '../infrastructure/repositories/contabilidad-closing.api.repository'

export const contabilidadClosingKeys = {
  root: ['contabilidad-closing'] as const,
  preview: (periodId?: string) => [...contabilidadClosingKeys.root, 'preview', periodId] as const,
}

export function useContabilidadClosingPreview(periodId: Ref<string | undefined>) {
  return useQuery({
    queryKey: computed(() => contabilidadClosingKeys.preview(periodId.value)),
    queryFn: () => closingRepository.getPreview(periodId.value!),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 5_000,
  })
}

export function useContabilidadClosePeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (periodId: string) => closingRepository.closePeriod(periodId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: contabilidadClosingKeys.root })
      void markapAlert.toast.success('Periodo cerrado correctamente.')
    },
    onError: (e) =>
      void markapAlert.toast.error('No se pudo cerrar el periodo', getApiErrorMessage(e)),
  })
}
