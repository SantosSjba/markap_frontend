import { apiClient } from '@app/api/apiClient'

/** Catálogos geográficos y de documento (misma forma que API; módulo Ventas sin depender de Alquileres). */
export interface VentasDocumentType {
  id: string
  code: string
  name: string
  length: number | null
}

export interface VentasDepartment {
  id: string
  name: string
}

export interface VentasProvince {
  id: string
  name: string
  departmentId: string
}

export interface VentasDistrict {
  id: string
  name: string
  provinceId: string
  province: {
    id: string
    name: string
    department: {
      id: string
      name: string
    }
  }
}

export const VENTAS_CLIENTS_APPLICATION_SLUG = 'ventas' as const

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
  documentType: VentasDocumentType
  primaryAddress: {
    id: string
    addressLine: string
    reference: string | null
    districtId: string
    district: VentasDistrict
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

const ventasScope = { applicationSlug: VENTAS_CLIENTS_APPLICATION_SLUG }

export const ventasClientsService = {
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

  create: (data: CreateVentasClientPayload) =>
    apiClient
      .post('/clients', {
        ...data,
        ...ventasScope,
        clientType: 'BUYER',
      })
      .then((r) => r.data),

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
