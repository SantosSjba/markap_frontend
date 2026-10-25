import { interiorReportesRepositoryKey } from '../../application/ports/reportes.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { useQueryErrorToast } from '@shared/presentation/composables/useQueryErrorToast'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type { InteriorReportesRangeParams } from '../../domain/reportes.types'
export type InteriorReportesHookOptions = {
  toastOnLoadError?: boolean
}

export const interiorReportesKeys = {
  root: ['interiorismo-reportes'] as const,
  dashboard: (p: object) => [...interiorReportesKeys.root, 'dashboard', p] as const,
}

export function invalidateInteriorReportesCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'interiorismo')
}

export function useInteriorReportsDashboard(
  params: Ref<InteriorReportesRangeParams>,
  options?: InteriorReportesHookOptions,
) {
  const interiorReportesRepository = useService(interiorReportesRepositoryKey)
  const q = useQuery({
    queryKey: computed(() =>
      interiorReportesKeys.dashboard({
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
