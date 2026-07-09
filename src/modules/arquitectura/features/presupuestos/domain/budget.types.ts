export interface ArquitecturaBudgetSummaryClientRef {
  id: string
  fullName: string
  documentNumber: string
}

export interface ArquitecturaBudgetSummaryListItem {
  projectId: string
  projectCode: string
  projectName: string
  projectStatus: string
  projectType: string
  client: ArquitecturaBudgetSummaryClientRef
  currency: string
  sectionCount: number
  lineItemCount: number
  priceTotal: number
  hasBudget: boolean
  budgetUpdatedAt: string | null
}

export interface ListArquitecturaBudgetSummariesParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  status?: string
  clientId?: string
  onlyWithBudget?: boolean
}

export interface ListArquitecturaBudgetSummariesResponse {
  data: ArquitecturaBudgetSummaryListItem[]
  total: number
  page: number
  limit: number
}
