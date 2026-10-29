import { apiClient } from '@shared/infrastructure/http/api-client'
import { INTERIORISMO_APP_SLUG } from '../../../config/app.constants'
import type {
  CreateInteriorProjectActivityPayload,
  CreateInteriorProjectPayload,
  InteriorClientPaymentDto,
  InteriorClientProjectsSummary,
  InteriorProjectDetail,
  InteriorProjectStats,
  ListInteriorProjectsParams,
  ListInteriorProjectsResponse,
  UpdateInteriorProjectPayload,
} from '../domain/project.types'
import type { InteriorProjectsRepository } from '../domain/repositories/projects.repository'
const BASE = '/interiorismo-projects'

export const interiorProjectsApiRepository: InteriorProjectsRepository = {
  getList: (params: ListInteriorProjectsParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', params.applicationSlug ?? INTERIORISMO_APP_SLUG)
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 10))
    if (params.search) searchParams.set('search', params.search)
    if (params.status) searchParams.set('status', params.status)
    if (params.inProgressOnly) searchParams.set('inProgressOnly', 'true')
    if (params.clientId) searchParams.set('clientId', params.clientId)
    if (params.projectType) searchParams.set('projectType', params.projectType)
    if (params.agentId) searchParams.set('agentId', params.agentId)
    return apiClient
      .get<ListInteriorProjectsResponse>(`${BASE}?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getById: (id: string) =>
    apiClient
      .get<InteriorProjectDetail>(`${BASE}/${id}`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  create: (payload: CreateInteriorProjectPayload) =>
    apiClient
      .post<InteriorProjectDetail>(BASE, {
        ...payload,
        applicationSlug: INTERIORISMO_APP_SLUG,
      })
      .then((r) => r.data),

  update: (id: string, payload: UpdateInteriorProjectPayload) =>
    apiClient
      .patch<InteriorProjectDetail>(`${BASE}/${id}`, payload, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  getStats: () =>
    apiClient
      .get<InteriorProjectStats>(`${BASE}/stats`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  getClientsSummary: (clientIds) =>
    apiClient
      .get<InteriorClientProjectsSummary[]>(`${BASE}/clients/summary`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG, clientIds: clientIds.join(',') },
      })
      .then((r) => r.data),

  getClientPayments: (clientId) =>
    apiClient
      .get<InteriorClientPaymentDto[]>(`${BASE}/clients/${clientId}/payments`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  createActivity: (projectId: string, payload: CreateInteriorProjectActivityPayload) =>
    apiClient
      .post(`${BASE}/${encodeURIComponent(projectId)}/activities`, payload, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  deleteActivity: (projectId: string, activityId: string) =>
    apiClient
      .delete(`${BASE}/${encodeURIComponent(projectId)}/activities/${encodeURIComponent(activityId)}`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),
}
