import { apiClient } from '@app/api/apiClient'

export interface PropertyType {
  id: string
  name: string
  code: string
  isActive: boolean
}

export interface Department {
  id: string
  name: string
}

export interface Province {
  id: string
  name: string
  departmentId: string
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

export type PropertyMediaItem = { url: string; kind: 'photo' | 'plan' }

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
  salePrice?: number | null
  projectName?: string | null
  mediaItems?: PropertyMediaItem[] | null
  listingStatus?: string | null
}

/** Propiedad completa (para edición) - mismo shape que el backend PropertyData */
export interface PropertyDetail {
  id: string
  applicationId: string
  code: string
  propertyTypeId: string
  addressLine: string
  districtId: string
  district?: {
    id: string
    name: string
    province: {
      id: string
      name: string
      department: {
        id: string
        name: string
      }
    }
  } | null
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
  salePrice: number | null
  projectName: string | null
  mediaItems: PropertyMediaItem[] | null
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
  salePrice: number | null
  projectName: string | null
  listingStatus: string | null
  /** true si tiene al menos un alquiler en vigencia (permite "Cambiar estado") */
  hasActiveRental?: boolean
  /** Fecha de vencimiento del alquiler vigente (ISO string), si tiene */
  activeRentalEndDate?: string | null
  /** Nombre del inquilino del alquiler vigente, si tiene */
  activeRentalTenantName?: string | null
}

export interface ListPropertiesParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  propertyTypeId?: string
  districtId?: string
  listingStatus?: string
  minSalePrice?: number
  maxSalePrice?: number
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
  reserved: number
  sold: number
}

export const propertiesService = {
  getPropertyTypes: () =>
    apiClient.get<PropertyType[]>('/properties/property-types').then((r) => r.data),

  getDepartments: () =>
    apiClient.get<Department[]>('/properties/departments').then((r) => r.data),

  getProvinces: (departmentId?: string) => {
    const params = departmentId ? { departmentId } : {}
    return apiClient.get<Province[]>('/properties/provinces', { params }).then((r) => r.data)
  },

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
      .post('/properties', {
        ...data,
        applicationSlug: data.applicationSlug ?? 'alquileres',
      })
      .then((r) => r.data),

  getList: (params: ListPropertiesParams) => {
    const {
      applicationSlug = 'alquileres',
      page = 1,
      limit = 10,
      search,
      propertyTypeId,
      districtId,
      listingStatus,
      minSalePrice,
      maxSalePrice,
    } = params
    const query: Record<string, string | number> = { applicationSlug, page, limit }
    if (search?.trim()) query.search = search.trim()
    if (propertyTypeId) query.propertyTypeId = propertyTypeId
    if (districtId) query.districtId = districtId
    if (listingStatus) query.listingStatus = listingStatus
    if (minSalePrice != null && Number.isFinite(minSalePrice)) query.minSalePrice = minSalePrice
    if (maxSalePrice != null && Number.isFinite(maxSalePrice)) query.maxSalePrice = maxSalePrice
    return apiClient.get<ListPropertiesResponse>('/properties', { params: query }).then((r) => r.data)
  },

  getStats: (applicationSlug = 'alquileres') =>
    apiClient.get<PropertyStats>('/properties/stats', { params: { applicationSlug } }).then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<PropertyDetail>('/properties/' + encodeURIComponent(id)).then((r) => r.data),

  update: (id: string, data: UpdatePropertyPayload) =>
    apiClient.patch<PropertyDetail>('/properties/' + encodeURIComponent(id), data).then((r) => r.data),

  /** Cambiar solo estado de listado (solo si la propiedad tiene alquiler en vigencia) */
  updateListingStatus: (
    id: string,
    listingStatus: 'RENTED' | 'EXPIRING' | 'MAINTENANCE',
  ) =>
    apiClient
      .patch<PropertyDetail>(`/properties/${encodeURIComponent(id)}/listing-status`, {
        listingStatus,
      })
      .then((r) => r.data),

  delete: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/properties/${encodeURIComponent(id)}`).then((r) => r.data),
}
