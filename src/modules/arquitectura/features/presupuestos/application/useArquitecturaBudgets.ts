import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import type { ListArquitecturaBudgetSummariesParams } from '../domain/budget.types'
import { arquitecturaBudgetsApiRepository as repo } from '../infrastructure/budgets.api.repository'

export const arquitecturaBudgetKeys = {
  all: ['arquitectura-budget-summaries', ARQUITECTURA_APP_SLUG] as const,
  list: (p: ListArquitecturaBudgetSummariesParams) =>
    [...arquitecturaBudgetKeys.all, 'list', p] as const,
}

export function useArquitecturaBudgetSummariesList(
  params: Ref<ListArquitecturaBudgetSummariesParams>,
) {
  return useQuery({
    queryKey: computed(() => arquitecturaBudgetKeys.list(params.value)),
    queryFn: () => repo.getSummaries(params.value),
  })
}
