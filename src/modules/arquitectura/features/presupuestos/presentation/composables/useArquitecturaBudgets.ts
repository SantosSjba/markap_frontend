import { arquitecturaBudgetsRepositoryKey as repoKey } from '../../application/ports/budgets.port'
import { useService } from '@shared/presentation/di/services'
import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { ARQUITECTURA_APP_SLUG } from '../../../../config/app.constants'
import type { ListArquitecturaBudgetSummariesParams } from '../../domain/budget.types'
export const arquitecturaBudgetKeys = {
  all: ['arquitectura-budget-summaries', ARQUITECTURA_APP_SLUG] as const,
  list: (p: ListArquitecturaBudgetSummariesParams) =>
    [...arquitecturaBudgetKeys.all, 'list', p] as const,
}

export function useArquitecturaBudgetSummariesList(
  params: Ref<ListArquitecturaBudgetSummariesParams>,
) {
  const repo = useService(repoKey)
  return useQuery({
    queryKey: computed(() => arquitecturaBudgetKeys.list(params.value)),
    queryFn: () => repo.getSummaries(params.value),
  })
}
