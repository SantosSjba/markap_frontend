import { arquitecturaReportesRepositoryKey as interiorReportesRepositoryKey } from '../../application/ports/reportes.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { useQueryErrorToast } from '@shared/presentation/composables/useQueryErrorToast'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type { ArquitecturaReportesRangeParams } from '../../domain/reportes.types'
export type ArquitecturaReportesHookOptions = {
  toastOnLoadError?: boolean
}

export const arquitecturaReportesKeys = {
  root: ['arquitectura-reportes'] as const,
  dashboard: (p: object) => [...arquitecturaReportesKeys.root, 'dashboard', p] as const,
}

export function invalidateArquitecturaReportesCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'arquitectura')
}

export function useArquitecturaReportsDashboard(
  params: Ref<ArquitecturaReportesRangeParams>,
  options?: ArquitecturaReportesHookOptions,
) {
  const interiorReportesRepository = useService(interiorReportesRepositoryKey)
  const q = useQuery({
    queryKey: computed(() =>
      arquitecturaReportesKeys.dashboard({
        start: params.value.startDate,
        end: params.value.endDate,
      }),
    ),
    queryFn: () =>
      interiorReportesRepository.getDashboard({
        startDate: params.value.startDate,
        endDate: params.value.endDate,
      }),
    enabled: computed(() => !!params.value.startDate && !!params.value.endDate),
    retry: 1,
  })
  if (options?.toastOnLoadError !== false) {
    useQueryErrorToast(q.error, 'No se pudieron cargar los reportes', {
      burstGroup: 'interior-reportes',
    })
  }
  return q
}
