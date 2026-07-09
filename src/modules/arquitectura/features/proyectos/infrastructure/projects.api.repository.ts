import { apiClient } from '@core/api/apiClient'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import type {
  CreateArquitecturaProjectPayload,
  ArquitecturaProjectDetail,
  ListArquitecturaProjectsParams,
  ListArquitecturaProjectsResponse,
  UpdateArquitecturaProjectPayload,
} from '../domain/project.types'
import type { ArquitecturaProjectsRepository } from '../domain/repositories/projects.repository'

const BASE = '/arquitectura-projects'

export const arquitecturaProjectsApiRepository: ArquitecturaProjectsRepository = {
  getList: (params: ListArquitecturaProjectsParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', params.applicationSlug ?? ARQUITECTURA_APP_SLUG)
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 10))
    if (params.search) searchParams.set('search', params.search)
    if (params.status) searchParams.set('status', params.status)
    if (params.inProgressOnly) searchParams.set('inProgressOnly', 'true')
    if (params.clientId) searchParams.set('clientId', params.clientId)
    return apiClient
      .get<ListArquitecturaProjectsResponse>(`${BASE}?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getById: (id: string) =>
    apiClient
      .get<ArquitecturaProjectDetail>(`${BASE}/${id}`, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),

  create: (payload: CreateArquitecturaProjectPayload) =>
    apiClient
      .post<ArquitecturaProjectDetail>(BASE, {
        ...payload,
        applicationSlug: ARQUITECTURA_APP_SLUG,
      })
      .then((r) => r.data),

  update: (id: string, payload: UpdateArquitecturaProjectPayload) =>
    apiClient
      .patch<ArquitecturaProjectDetail>(`${BASE}/${id}`, payload, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),
}
