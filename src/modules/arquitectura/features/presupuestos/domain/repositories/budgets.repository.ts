import type {
  ListArquitecturaBudgetSummariesParams,
  ListArquitecturaBudgetSummariesResponse,
} from '../budget.types'

export interface ArquitecturaBudgetsRepository {
  getSummaries(params: ListArquitecturaBudgetSummariesParams): Promise<ListArquitecturaBudgetSummariesResponse>
}
