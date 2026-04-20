import { apiClient } from '@core/api/apiClient'
import {
  VENTAS_CLIENTS_APPLICATION_SLUG,
  type CreateVentasClientPayload,
  type ListVentasClientsParams,
  type ListVentasClientsResponse,
  type UpdateVentasClientPayload,
  type VentasClientDetail,
  type VentasClientStats,
  type VentasDepartment,
  type VentasDistrict,
  type VentasDocumentType,
  type VentasProvince,
} from '../../domain/client.types'
import type { VentasClientsRepository } from '../../domain/repositories/ventas-clients.repository'

const ventasScope = { applicationSlug: VENTAS_CLIENTS_APPLICATION_SLUG }

export const ventasClientsApiRepository: VentasClientsRepository = {
  getDocumentTypes: () =>
    apiClient.get<VentasDocumentType[]>('/clients/document-types').then((r) => r.data),

  getDepartments: () =>
    apiClient.get<VentasDepartment[]>('/clients/departments').then((r) => r.data),

  getProvinces: (departmentId?: string) => {
    const params = departmentId ? { departmentId } : {}
    return apiClient.get<VentasProvince[]>('/clients/provinces', { params }).then((r) => r.data)
  },

  getDistricts: (provinceId?: string) => {
    const params = provinceId ? { provinceId } : {}
    return apiClient
      .get<VentasDistrict[]>('/clients/districts', { params })
      .then((r) => r.data)
  },

  getList: (params: ListVentasClientsParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', VENTAS_CLIENTS_APPLICATION_SLUG)
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 10))
    if (params.search) searchParams.set('search', params.search)
    if (params.clientType) searchParams.set('clientType', params.clientType)
    if (params.salesStatus) searchParams.set('salesStatus', params.salesStatus)
    if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
    return apiClient
      .get<ListVentasClientsResponse>(`/clients?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getStats: () =>
    apiClient
      .get<VentasClientStats>(`/clients/stats`, { params: ventasScope })
      .then((r) => r.data),

  create: (data: CreateVentasClientPayload) => {
    const {
      clientType,
      address,
      salesStatus,
      leadOrigin,
      assignedAgentId,
      ...rest
    } = data
    const body: Record<string, unknown> = {
      ...rest,
      ...ventasScope,
      clientType,
    }
    if (clientType === 'BUYER') {
      body.salesStatus = salesStatus ?? 'PROSPECT'
      body.leadOrigin = leadOrigin ?? null
      body.assignedAgentId = assignedAgentId?.trim() || null
    }
    if (clientType === 'OWNER' && address) {
      body.address = address
    }
    return apiClient.post<VentasClientDetail>('/clients', body).then((r) => r.data)
  },

  getById: (id: string) =>
    apiClient
      .get<VentasClientDetail>(`/clients/${encodeURIComponent(id)}`, { params: ventasScope })
      .then((r) => r.data),

  update: (id: string, data: UpdateVentasClientPayload) =>
    apiClient
      .patch(`/clients/${encodeURIComponent(id)}`, data, { params: ventasScope })
      .then((r) => r.data),

  delete: (id: string): Promise<{ message: string }> =>
    apiClient
      .delete(`/clients/${encodeURIComponent(id)}`, { params: ventasScope })
      .then((r) => r.data),
}
