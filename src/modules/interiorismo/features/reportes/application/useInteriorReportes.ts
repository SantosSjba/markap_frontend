import { useQuery, type QueryClient } from '@tanstack/vue-query'
import { computed, watch, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { InteriorReportesRangeParams } from '../domain/reportes.types'
import { interiorReportesApiRepository as interiorReportesRepository } from '../infrastructure/repositories/reportes.api.repository'

function toastReportLoadError(error: Ref<unknown>) {
  watch(
    () => error.value,
    (err) => {
      if (err)
        void markapAlert.toast.error('No se pudieron cargar los reportes', getApiErrorMessage(err))
    },
  )
}

export const interiorReportesKeys = {
  root: ['interiorismo-reportes'] as const,
  dashboard: (p: object) => [...interiorReportesKeys.root, 'dashboard', p] as const,
}

export function invalidateInteriorReportesCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, interiorReportesKeys.root)
}

export function useInteriorReportsDashboard(params: Ref<InteriorReportesRangeParams>) {
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
  toastReportLoadError(q.error)
  return q
}
