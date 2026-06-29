import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { ContabilidadPeriodStatus } from '../domain/period.types'
import { contabilidadPeriodsApiRepository as periodsRepository } from '../infrastructure/repositories/contabilidad-periods.api.repository'

export const contabilidadPeriodsKeys = {
  root: ['contabilidad-periods'] as const,
  list: (year: number) => [...contabilidadPeriodsKeys.root, 'list', year] as const,
}

export function invalidateContabilidadPeriodsCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, contabilidadPeriodsKeys.root)
}

export function useContabilidadPeriodsList(year: Ref<number>) {
  return useQuery({
    queryKey: computed(() => contabilidadPeriodsKeys.list(year.value)),
    queryFn: () => periodsRepository.list(year.value),
    staleTime: 15_000,
  })
}

export function useContabilidadSetPeriodStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; status: ContabilidadPeriodStatus }) =>
      periodsRepository.setStatus(args.id, args.status),
    onSuccess: (_data, vars) => {
      void invalidateContabilidadPeriodsCache(qc)
      void markapAlert.toast.success(
        vars.status === 'OPEN' ? 'Periodo abierto' : 'Periodo cerrado',
      )
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}
