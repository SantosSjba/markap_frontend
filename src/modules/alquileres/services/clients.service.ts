import { apiClient } from '@core/api'

export interface DocumentType {
  id: string
  code: string
  name: string
  length: number | null
}

export interface District {
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

export interface CreateClientPayload {
  applicationSlug?: string
  clientType: 'OWNER' | 'TENANT'
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
  address: {
    addressLine: string
    districtId: string
    reference?: string | null
  }
}

/** Detalle de cliente (GET /clients/:id) con documentType y primaryAddress anidados */
export interface ClientDetail {
  id: string
  applicationSlug: string
  clientType: 'OWNER' | 'TENANT'
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
  documentType: DocumentType
  primaryAddress: {
    id: string
    addressLine: string
    reference: string | null
    districtId: string
    district: District
  } | null
}

/** Payload para PATCH /clients/:id (todos opcionales) */
export interface UpdateClientPayload {
  clientType?: 'OWNER' | 'TENANT'
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
  address?: {
    addressLine?: string
    districtId?: string
    reference?: string | null
  }
}

export interface ClientListItem {
  id: string
  fullName: string
  documentTypeCode: string
  documentNumber: string
  primaryPhone: string
  primaryEmail: string
  clientType: 'OWNER' | 'TENANT'
  isActive: boolean
  propertiesCount: number
  contractsCount: number
}

export interface ClientStats {
  total: number
  owners: number
  tenants: number
  active: number
}

export interface ListClientsParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  clientType?: 'OWNER' | 'TENANT'
  isActive?: boolean
}

export interface ListClientsResponse {
  data: ClientListItem[]
  total: number
  page: number
  limit: number
}

export const clientsService = {
  getDocumentTypes: () =>
    apiClient.get<DocumentType[]>('/clients/document-types').then((r) => r.data),

  getDistricts: (provinceId?: string) => {
    const params = provinceId ? { provinceId } : {}
    return apiClient
      .get<District[]>('/clients/districts', { params })
      .then((r) => r.data)
  },

  getList: (params: ListClientsParams) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', params.applicationSlug ?? 'alquileres')
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 10))
    if (params.search) searchParams.set('search', params.search)
    if (params.clientType) searchParams.set('clientType', params.clientType)
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
}
