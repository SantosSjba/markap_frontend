import { apiClient } from '@core/api/apiClient'
import type {
  ClientDetail,
  ClientStats,
  CreateClientPayload,
  District,
  DocumentType,
  Department,
  ListClientsParams,
  ListClientsResponse,
  Province,
  UpdateClientPayload,
} from '../domain/client.types'

export const clientsService = {
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
    searchParams.set('applicationSlug', params.applicationSlug ?? 'alquileres')
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 10))
    if (params.search) searchParams.set('search', params.search)
    if (params.clientType) searchParams.set('clientType', params.clientType)
    if (params.salesStatus) searchParams.set('salesStatus', params.salesStatus)
    if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
    return apiClient
      .get<ListClientsResponse>(`/clients?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getStats: (applicationSlug = 'alquileres') =>
    apiClient
      .get<ClientStats>(`/clients/stats?applicationSlug=${applicationSlug}`)
      .then((r) => r.data),

  create: (data: CreateClientPayload) =>
    apiClient.post('/clients', { ...data, applicationSlug: 'alquileres' }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ClientDetail>(`/clients/${id}`).then((r) => r.data),

  update: (id: string, data: UpdateClientPayload) =>
    apiClient.patch(`/clients/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<{ message: string }> =>
    apiClient
      .delete(`/clients/${id}`, { params: { applicationSlug: 'alquileres' } })
      .then((r) => r.data),
}
