import { useQuery, type QueryClient } from '@tanstack/vue-query'
import { computed, watch, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { VentasReportesRangeParams } from '../domain/reportes.types'
import { ventasReportesApiRepository as ventasReportesRepository } from '../infrastructure/repositories/ventas-reportes.api.repository'

function toastReportLoadError(error: Ref<unknown>) {
  watch(
    () => error.value,
    (err) => {
      if (err) void markapAlert.toast.error('No se pudieron cargar los reportes', getApiErrorMessage(err))
    },
  )
}

export const ventasReportesKeys = {
  root: ['ventas-reportes'] as const,
  salesByPeriod: (p: object) => [...ventasReportesKeys.root, 'sales-by-period', p] as const,
  agentPerformance: (p: object) => [...ventasReportesKeys.root, 'agent-performance', p] as const,
  conversion: (p: object) => [...ventasReportesKeys.root, 'conversion', p] as const,
  financialFlow: (p: object) => [...ventasReportesKeys.root, 'financial-flow', p] as const,
}

export function invalidateVentasReportesCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, ventasReportesKeys.root)
}

export type { VentasReportesRangeParams } from '../domain/reportes.types'

export function useVentasSalesByPeriodReport(params: Ref<VentasReportesRangeParams>) {
  const q = useQuery({
    queryKey: computed(() =>
      ventasReportesKeys.salesByPeriod({
        start: params.value.startDate,
        end: params.value.endDate,
        g: params.value.granularity ?? 'month',
      }),
    ),
    queryFn: () =>
      ventasReportesRepository.salesByPeriod({
        startDate: params.value.startDate,
        endDate: params.value.endDate,
        granularity: params.value.granularity ?? 'month',
      }),
    enabled: computed(() => !!params.value.startDate && !!params.value.endDate),
    retry: 1,
  })
  toastReportLoadError(q.error)
  return q
}

export function useVentasAgentPerformanceReport(
  params: Ref<{ startDate: string; endDate: string }>,
) {
  const q = useQuery({
    queryKey: computed(() =>
      ventasReportesKeys.agentPerformance({
        start: params.value.startDate,
        end: params.value.endDate,
      }),
    ),
    queryFn: () =>
      ventasReportesRepository.agentPerformance({
        startDate: params.value.startDate,
        endDate: params.value.endDate,
      }),
    enabled: computed(() => !!params.value.startDate && !!params.value.endDate),
    retry: 1,
  })
  toastReportLoadError(q.error)
  return q
}

export function useVentasConversionReport(params: Ref<{ startDate: string; endDate: string }>) {
  const q = useQuery({
    queryKey: computed(() =>
      ventasReportesKeys.conversion({
        start: params.value.startDate,
        end: params.value.endDate,
      }),
    ),
    queryFn: () =>
      ventasReportesRepository.conversion({
        startDate: params.value.startDate,
        endDate: params.value.endDate,
      }),
    enabled: computed(() => !!params.value.startDate && !!params.value.endDate),
    retry: 1,
  })
  toastReportLoadError(q.error)
  return q
}

export function useVentasFinancialFlowReport(params: Ref<{ startDate: string; endDate: string }>) {
  const q = useQuery({
    queryKey: computed(() =>
      ventasReportesKeys.financialFlow({
        start: params.value.startDate,
        end: params.value.endDate,
      }),
    ),
    queryFn: () =>
      ventasReportesRepository.financialFlow({
        startDate: params.value.startDate,
        endDate: params.value.endDate,
      }),
    enabled: computed(() => !!params.value.startDate && !!params.value.endDate),
    retry: 1,
  })
  toastReportLoadError(q.error)
  return q
}
