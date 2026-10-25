import { contabilidadFinancialRepositoryKey as financialRepositoryKey } from '../../application/ports/contabilidad-financial.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
export const contabilidadFinancialKeys = {
  root: ['contabilidad-financial'] as const,
  balanceSheet: (periodId?: string) =>
    [...contabilidadFinancialKeys.root, 'balance-sheet', periodId] as const,
  incomeStatement: (periodId?: string) =>
    [...contabilidadFinancialKeys.root, 'income-statement', periodId] as const,
  cashFlow: (periodId?: string) =>
    [...contabilidadFinancialKeys.root, 'cash-flow', periodId] as const,
}

export function useContabilidadBalanceSheet(periodId: Ref<string | undefined>) {
  const financialRepository = useService(financialRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadFinancialKeys.balanceSheet(periodId.value)),
    queryFn: () => financialRepository.getBalanceSheet(periodId.value!),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 15_000,
  })
}

export function useContabilidadIncomeStatement(periodId: Ref<string | undefined>) {
  const financialRepository = useService(financialRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadFinancialKeys.incomeStatement(periodId.value)),
    queryFn: () => financialRepository.getIncomeStatement(periodId.value!),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 15_000,
  })
}

export function useContabilidadCashFlowStatement(periodId: Ref<string | undefined>) {
  const financialRepository = useService(financialRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadFinancialKeys.cashFlow(periodId.value)),
    queryFn: () => financialRepository.getCashFlowStatement(periodId.value!),
    enabled: computed(() => Boolean(periodId.value)),
    staleTime: 15_000,
  })
}
