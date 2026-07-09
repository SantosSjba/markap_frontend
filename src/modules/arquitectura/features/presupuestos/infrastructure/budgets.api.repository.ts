import { apiClient } from '@core/api/apiClient'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import type { ArquitecturaBudgetsRepository } from '../domain/repositories/budgets.repository'
import type {
  ListArquitecturaBudgetSummariesParams,
  ListArquitecturaBudgetSummariesResponse,
} from '../domain/budget.types'

const BASE = '/arquitectura-projects/budget-summaries'

export const arquitecturaBudgetsApiRepository: ArquitecturaBudgetsRepository = {
  getSummaries: (params: ListArquitecturaBudgetSummariesParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', params.applicationSlug ?? ARQUITECTURA_APP_SLUG)
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 10))
    if (params.search) searchParams.set('search', params.search)
    if (params.status) searchParams.set('status', params.status)
    if (params.clientId) searchParams.set('clientId', params.clientId)
    if (params.onlyWithBudget) searchParams.set('onlyWithBudget', 'true')
    return apiClient
      .get<ListArquitecturaBudgetSummariesResponse>(`${BASE}?${searchParams.toString()}`)
      .then((r) => r.data)
  },
}
