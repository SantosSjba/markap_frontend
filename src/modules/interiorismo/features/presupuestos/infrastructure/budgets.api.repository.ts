import { apiClient } from '@core/api/apiClient'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type { InteriorBudgetsRepository } from '../domain/repositories/budgets.repository'
import type {
  CreateInteriorBudgetPayload,
  InteriorBudgetDetail,
  ListInteriorBudgetsParams,
  ListInteriorBudgetsResponse,
  UpdateInteriorBudgetPayload,
} from '../domain/budget.types'

const BASE = '/interiorismo-budgets'

export const interiorBudgetsApiRepository: InteriorBudgetsRepository = {
  getList: (params: ListInteriorBudgetsParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', params.applicationSlug ?? INTERIORISMO_APP_SLUG)
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 10))
    if (params.search) searchParams.set('search', params.search)
    if (params.projectId) searchParams.set('projectId', params.projectId)
    if (params.clientId) searchParams.set('clientId', params.clientId)
    if (params.status) searchParams.set('status', params.status)
    return apiClient
      .get<ListInteriorBudgetsResponse>(`${BASE}?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getById: (id: string) =>
    apiClient
      .get<InteriorBudgetDetail>(`${BASE}/${id}`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  create: (payload: CreateInteriorBudgetPayload) =>
    apiClient.post<InteriorBudgetDetail>(BASE, payload).then((r) => r.data),

  update: (id: string, payload: UpdateInteriorBudgetPayload) =>
    apiClient.patch<InteriorBudgetDetail>(`${BASE}/${id}`, payload).then((r) => r.data),

  duplicate: (id: string) =>
    apiClient.post<InteriorBudgetDetail>(`${BASE}/${id}/duplicate`).then((r) => r.data),

  addComment: (id: string, body: string) =>
    apiClient.post(`${BASE}/${id}/comments`, { body }).then((r) => r.data),

  addAttachment: (id: string, title: string, fileUrl: string) =>
    apiClient.post(`${BASE}/${id}/attachments`, { title, fileUrl }).then((r) => r.data),

  fetchPdfHtml: (id: string) =>
    apiClient
      .get(`${BASE}/${id}/pdf`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
        responseType: 'text',
      })
      .then((r) => String(r.data)),
}
