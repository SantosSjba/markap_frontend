import { apiClient } from '@app/api/apiClient'
import type {
  DocumentType,
  Department,
  Province,
  District,
} from '@applications/alquileres/clientes/services/clients.service'

export const VENTAS_CLIENTS_APPLICATION_SLUG = 'ventas'

export type SalesPipelineStatus = 'PROSPECT' | 'INTERESTED' | 'CLIENT'

export interface VentasClientListItem {
  id: string
  fullName: string
  documentTypeCode: string
  documentNumber: string
  primaryPhone: string
  primaryEmail: string
  clientType: 'BUYER'
  isActive: boolean
  propertiesCount: number
  contractsCount: number
  salesStatus: SalesPipelineStatus | null
  leadOrigin: string | null
  assignedAgentName: string | null
}

export interface VentasClientDetail {
  id: string
  applicationSlug: string
  clientType: 'BUYER'
  documentTypeId: string
  documentNumber: string
  fullName: string
  legalRepresentativeName: string | null
  legalRepresentativePosition: string | null
  primaryPhone: string
  secondaryPhone: string | null
  primaryEmail: string
  secondaryEmail: string | null
  notes: string | null
  isActive: boolean
  salesStatus: SalesPipelineStatus | null
  leadOrigin: string | null
  assignedAgentId: string | null
  documentType: DocumentType
  primaryAddress: {
    id: string
    addressLine: string
    reference: string | null
    districtId: string
    district: District
  } | null
  assignedAgent: { id: string; fullName: string } | null
}

export interface CreateVentasClientPayload {
  documentTypeId: string
  documentNumber: string
  fullName: string
  legalRepresentativeName?: string | null
  legalRepresentativePosition?: string | null
  primaryPhone: string
  secondaryPhone?: string | null
  primaryEmail: string
  secondaryEmail?: string | null
  notes?: string | null
  salesStatus?: SalesPipelineStatus
  leadOrigin?: string | null
  assignedAgentId?: string | null
}

export interface UpdateVentasClientPayload {
  documentTypeId?: string
  documentNumber?: string
  fullName?: string
  legalRepresentativeName?: string | null
  legalRepresentativePosition?: string | null
  primaryPhone?: string
  secondaryPhone?: string | null
  primaryEmail?: string
  secondaryEmail?: string | null
  notes?: string | null
  salesStatus?: SalesPipelineStatus | null
  leadOrigin?: string | null
  assignedAgentId?: string | null
}

export interface ListVentasClientsParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  salesStatus?: SalesPipelineStatus
  isActive?: boolean
}

export interface ListVentasClientsResponse {
  data: VentasClientListItem[]
  total: number
  page: number
  limit: number
}

export interface VentasClientStats {
  total: number
  owners: number
  tenants: number
  active: number
  prospects?: number
  interested?: number
  salesClients?: number
}

export const ventasClientsService = {
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
    return apiClient
      .get<District[]>('/clients/districts', { params })
      .then((r) => r.data)
  },

  getList: (params: ListVentasClientsParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', params.applicationSlug ?? VENTAS_CLIENTS_APPLICATION_SLUG)
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 10))
    if (params.search) searchParams.set('search', params.search)
    if (params.salesStatus) searchParams.set('salesStatus', params.salesStatus)
    if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
    return apiClient
      .get<ListVentasClientsResponse>(`/clients?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getStats: (applicationSlug = VENTAS_CLIENTS_APPLICATION_SLUG) =>
    apiClient
      .get<VentasClientStats>(`/clients/stats?applicationSlug=${applicationSlug}`)
      .then((r) => r.data),

  create: (data: CreateVentasClientPayload) =>
    apiClient
      .post('/clients', {
        ...data,
        applicationSlug: VENTAS_CLIENTS_APPLICATION_SLUG,
        clientType: 'BUYER',
      })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<VentasClientDetail>(`/clients/${id}`).then((r) => r.data),

  update: (id: string, data: UpdateVentasClientPayload) =>
    apiClient.patch(`/clients/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/clients/${id}`).then((r) => r.data),
}
