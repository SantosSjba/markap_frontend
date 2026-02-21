import { apiClient } from '@core/api'

export interface PropertyType {
  id: string
  name: string
  code: string
  isActive: boolean
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

export interface OwnerOption {
  id: string
  fullName: string
  documentNumber: string
  primaryPhone: string
  primaryEmail: string
}

export interface CreatePropertyPayload {
  applicationSlug?: string
  code: string
  propertyTypeId: string
  addressLine: string
  districtId: string
  description?: string | null
  area?: number | null
  bedrooms?: number | null
  bathrooms?: number | null
  ageYears?: number | null
  floorLevel?: string | null
  parkingSpaces?: number | null
  partida1?: string | null
  partida2?: string | null
  partida3?: string | null
  ownerId: string
  monthlyRent?: number | null
  maintenanceAmount?: number | null
  depositMonths?: number | null
}

/** Propiedad completa (para edición) - mismo shape que el backend PropertyData */
export interface PropertyDetail {
  id: string
  applicationId: string
  code: string
  propertyTypeId: string
  addressLine: string
  districtId: string
  description: string | null
  area: number | null
  bedrooms: number | null
  bathrooms: number | null
  ageYears: number | null
  floorLevel: string | null
  parkingSpaces: number | null
  partida1: string | null
  partida2: string | null
  partida3: string | null
  ownerId: string
  monthlyRent: number | null
  maintenanceAmount: number | null
  depositMonths: number | null
  listingStatus: string | null
  isActive: boolean
}

export type UpdatePropertyPayload = Omit<CreatePropertyPayload, 'applicationSlug'>

export interface PropertyListItem {
  id: string
  code: string
  addressLine: string
  districtName: string
  propertyTypeName: string
  area: number | null
  ownerId: string
  ownerFullName: string
  monthlyRent: number | null
  listingStatus: string | null
}

export interface ListPropertiesParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  propertyTypeId?: string
  listingStatus?: string
}

export interface ListPropertiesResponse {
  data: PropertyListItem[]
  total: number
  page: number
  limit: number
}

export interface PropertyStats {
  total: number
  rented: number
  available: number
  expiring: number
  maintenance: number
}

export const propertiesService = {
  getPropertyTypes: () =>
    apiClient.get<PropertyType[]>('/properties/property-types').then((r) => r.data),

  getDistricts: (provinceId?: string) => {
    const params = provinceId ? { provinceId } : {}
    return apiClient
      .get<District[]>('/properties/districts', { params })
      .then((r) => r.data)
  },

  getOwners: (applicationSlug = 'alquileres', search?: string) => {
    const params: Record<string, string> = { applicationSlug }
    if (search?.trim()) params.search = search.trim()
    return apiClient
      .get<OwnerOption[]>('/properties/owners', { params })
      .then((r) => r.data)
  },

  create: (data: CreatePropertyPayload) =>
    apiClient
      .post('/properties', { ...data, applicationSlug: 'alquileres' })
      .then((r) => r.data),

  getList: (params: ListPropertiesParams) => {
    const { applicationSlug = 'alquileres', page = 1, limit = 10, search, propertyTypeId, listingStatus } = params
    const query: Record<string, string | number> = { applicationSlug, page, limit }
    if (search?.trim()) query.search = search.trim()
    if (propertyTypeId) query.propertyTypeId = propertyTypeId
    if (listingStatus) query.listingStatus = listingStatus
    return apiClient.get<ListPropertiesResponse>('/properties', { params: query }).then((r) => r.data)
  },

  getStats: (applicationSlug = 'alquileres') =>
    apiClient.get<PropertyStats>('/properties/stats', { params: { applicationSlug } }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<PropertyDetail>('/properties/' + encodeURIComponent(id)).then((r) => r.data),

  update: (id: string, data: UpdatePropertyPayload) =>
    apiClient.patch<PropertyDetail>('/properties/' + encodeURIComponent(id), data).then((r) => r.data),
}
