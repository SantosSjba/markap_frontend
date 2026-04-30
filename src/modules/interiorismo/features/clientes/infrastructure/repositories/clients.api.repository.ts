import { apiClient } from '@core/api/apiClient'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type {
  ClientDetail,
  ClientStats,
  CreateInteriorClientPayload,
  Department,
  District,
  DocumentType,
  ListClientsParams,
  ListClientsResponse,
  Province,
  UpdateInteriorClientPayload,
} from '../../domain/client.types'
import type { InteriorClientsRepository } from '../../domain/repositories/clients.repository'

const clientsApi: InteriorClientsRepository = {
  getDocumentTypes: () =>
    apiClient.get<DocumentType[]>('/clients/document-types').then((r) => r.data),

  getDepartments: () =>
    apiClient.get<Department[]>('/clients/departments').then((r) => r.data),

  getProvinces: (departmentId?: string) => {
    const params = departmentId ? { departmentId } : {}
    return apiClient.get<Province[]>('/clients/provinces', { params }).then((r) => r.data)
  },

  getDistricts: (provinceId?: string) => {
    const params = provinceId ? { provinceId } : {}
    return apiClient.get<District[]>('/clients/districts', { params }).then((r) => r.data)
  },

  getList: (params: ListClientsParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', params.applicationSlug ?? INTERIORISMO_APP_SLUG)
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 10))
    if (params.search) searchParams.set('search', params.search)
    if (params.clientType) searchParams.set('clientType', params.clientType)
    if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
    return apiClient
      .get<ListClientsResponse>(`/clients?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getStats: (applicationSlug = INTERIORISMO_APP_SLUG) =>
    apiClient
      .get<ClientStats>(`/clients/stats?applicationSlug=${applicationSlug}`)
      .then((r) => r.data),

  create: (data: CreateInteriorClientPayload) =>
    apiClient
      .post<{ id: string } & Record<string, unknown>>('/clients', {
        ...data,
        applicationSlug: INTERIORISMO_APP_SLUG,
      })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ClientDetail>(`/clients/${id}`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  update: (id: string, data: UpdateInteriorClientPayload) =>
    apiClient
      .patch(`/clients/${id}`, data, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  delete: (id: string): Promise<{ message: string }> =>
    apiClient
      .delete(`/clients/${id}`, { params: { applicationSlug: INTERIORISMO_APP_SLUG } })
      .then((r) => r.data),
}

export const interiorClientsApiRepository: InteriorClientsRepository = clientsApi
