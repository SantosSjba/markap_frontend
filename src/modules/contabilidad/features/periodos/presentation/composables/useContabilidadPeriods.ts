import { contabilidadPeriodsRepositoryKey as periodsRepositoryKey } from '../../application/ports/contabilidad-periods.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import { activeLegalEntityIdRef } from '../../../../config/api-scope'
import type { ContabilidadPeriodStatus } from '../../domain/period.types'
export const contabilidadPeriodsKeys = {
  root: ['contabilidad-periods'] as const,
  list: (year: number, legalEntityId?: string) =>
    [...contabilidadPeriodsKeys.root, 'list', year, legalEntityId] as const,
}

export function invalidateContabilidadPeriodsCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'contabilidad')
}

export function useContabilidadPeriodsList(year: Ref<number>) {
  const periodsRepository = useService(periodsRepositoryKey)
  return useQuery({
    queryKey: computed(() =>
      contabilidadPeriodsKeys.list(year.value, activeLegalEntityIdRef.value),
    ),
    queryFn: () => periodsRepository.list(year.value),
    enabled: computed(() => Boolean(activeLegalEntityIdRef.value)),
    staleTime: 15_000,
  })
}

export function useContabilidadSetPeriodStatus() {
  const periodsRepository = useService(periodsRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (args: { id: string; status: ContabilidadPeriodStatus }) =>
      periodsRepository.setStatus(args.id, args.status),
    onSuccess: async (_data, vars) => {
      await invalidateContabilidadPeriodsCache(qc)
      void markapAlert.toast.success(vars.status === 'OPEN' ? 'Periodo abierto' : 'Periodo cerrado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo actualizar', getApiErrorMessage(e)),
  })
}
