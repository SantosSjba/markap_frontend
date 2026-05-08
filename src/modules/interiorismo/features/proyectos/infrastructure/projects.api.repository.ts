import { apiClient } from '@core/api/apiClient'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type {
  CreateInteriorProjectPayload,
  InteriorProjectDetail,
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
}
