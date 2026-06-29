import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { useQueryErrorToast } from '@/shared/composables'
import type { ProduccionReportesRangeParams } from '../domain/reportes.types'
import { produccionReportesApi } from '../infrastructure/reportes.api.repository'

export const produccionReportesKeys = {
  root: ['produccion-reportes'] as const,
  dashboard: (p: object) => [...produccionReportesKeys.root, 'dashboard', p] as const,
}

export function useProduccionReportsDashboard(
  params: Ref<ProduccionReportesRangeParams>,
  options?: { toastOnLoadError?: boolean },
) {
  const q = useQuery({
    queryKey: computed(() =>
      produccionReportesKeys.dashboard({
        start: params.value.startDate,
        end: params.value.endDate,
        clientId: params.value.clientId,
        category: params.value.category,
      }),
    ),
    queryFn: () => produccionReportesApi.getDashboard(params.value),
    enabled: computed(() => !!params.value.startDate && !!params.value.endDate),
    retry: 1,
  })
  if (options?.toastOnLoadError !== false) {
    useQueryErrorToast(q.error, 'No se pudieron cargar los reportes', {
      burstGroup: 'produccion-reportes',
    })
  }
  return q
}
