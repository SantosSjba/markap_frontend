import { contabilidadReportsRepositoryKey as reportsRepositoryKey } from '../../application/ports/contabilidad-reports.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
export const contabilidadReportsKeys = {
  root: ['contabilidad-reports'] as const,
  dashboard: (periodId?: string) =>
    [...contabilidadReportsKeys.root, 'dashboard', periodId] as const,
  trialBalance: (periodId?: string, costCenterId?: string) =>
    [...contabilidadReportsKeys.root, 'trial-balance', periodId, costCenterId] as const,
  analysis: (periodId?: string) => [...contabilidadReportsKeys.root, 'analysis', periodId] as const,
  cashTreasury: (periodId?: string) =>
    [...contabilidadReportsKeys.root, 'cash-treasury', periodId] as const,
}

export function useContabilidadReportsDashboard(periodId: Ref<string | undefined>) {
  const reportsRepository = useService(reportsRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadReportsKeys.dashboard(periodId.value)),
    queryFn: () => reportsRepository.getDashboard(periodId.value!),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 15_000,
  })
}

export function useContabilidadTrialBalance(
  periodId: Ref<string | undefined>,
  costCenterId: Ref<string | undefined>,
) {
  const reportsRepository = useService(reportsRepositoryKey)
  return useQuery({
    queryKey: computed(() =>
      contabilidadReportsKeys.trialBalance(periodId.value, costCenterId.value),
    ),
    queryFn: () =>
      reportsRepository.getTrialBalance(periodId.value!, costCenterId.value || undefined),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 15_000,
  })
}

export function useContabilidadFinancialAnalysis(periodId: Ref<string | undefined>) {
  const reportsRepository = useService(reportsRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadReportsKeys.analysis(periodId.value)),
    queryFn: () => reportsRepository.getFinancialAnalysis(periodId.value!),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 15_000,
  })
}

export function useContabilidadCashFlowTreasury(periodId: Ref<string | undefined>) {
  const reportsRepository = useService(reportsRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadReportsKeys.cashTreasury(periodId.value)),
    queryFn: () => reportsRepository.getCashFlowTreasury(periodId.value!),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 15_000,
  })
}
