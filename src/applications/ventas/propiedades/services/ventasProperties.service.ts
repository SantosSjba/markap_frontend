import { apiClient } from '@app/api/apiClient'

/** Slug fijo: inventario de propiedades solo para la aplicación Ventas. */
export const VENTAS_APP_SLUG = 'ventas' as const

export interface VentasPropertyType {
  id: string
  name: string
  code: string
  isActive: boolean
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

export interface VentasOwnerOption {
  id: string
  fullName: string
  documentNumber: string
  primaryPhone: string
  primaryEmail: string
}

export type VentasPropertyMediaItem = { url: string; kind: 'photo' | 'plan' }

/** Alta de propiedad en inventario Ventas (sin campos de alquiler). */
export interface VentasCreatePropertyPayload {
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
  salePrice?: number | null
  projectName?: string | null
  mediaItems?: VentasPropertyMediaItem[] | null
  listingStatus?: string | null
}

export interface VentasPropertyDetail {
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
  mediaItems: VentasPropertyMediaItem[] | null
  listingStatus: string | null
  isActive: boolean
}

export type VentasUpdatePropertyPayload = VentasCreatePropertyPayload

export interface VentasPropertyListItem {
  id: string
  code: string
  addressLine: string
  districtName: string
  propertyTypeName: string
  area: number | null
  ownerId: string
  ownerFullName: string
  salePrice: number | null
  projectName: string | null
  listingStatus: string | null
}

export interface VentasListPropertiesParams {
  page?: number
  limit?: number
  search?: string
  propertyTypeId?: string
  districtId?: string
  listingStatus?: string
  minSalePrice?: number
  maxSalePrice?: number
}

export interface VentasListPropertiesResponse {
  data: VentasPropertyListItem[]
  total: number
  page: number
  limit: number
}

export interface VentasPropertyStats {
  total: number
  rented: number
  available: number
  expiring: number
  maintenance: number
  reserved: number
  sold: number
}

const ventasScope = { applicationSlug: VENTAS_APP_SLUG }

export const ventasPropertiesService = {
  getPropertyTypes: () =>
    apiClient.get<VentasPropertyType[]>('/properties/property-types').then((r) => r.data),

  getDepartments: () =>
    apiClient.get<VentasDepartment[]>('/properties/departments').then((r) => r.data),

  getProvinces: (departmentId?: string) => {
    const params = departmentId ? { departmentId } : {}
    return apiClient.get<VentasProvince[]>('/properties/provinces', { params }).then((r) => r.data)
  },

  getDistricts: (provinceId?: string) => {
    const params = provinceId ? { provinceId } : {}
    return apiClient.get<VentasDistrict[]>('/properties/districts', { params }).then((r) => r.data)
  },

  getOwners: (search?: string) => {
    const params: Record<string, string> = { ...ventasScope }
    if (search?.trim()) params.search = search.trim()
    return apiClient.get<VentasOwnerOption[]>('/properties/owners', { params }).then((r) => r.data)
  },

  create: (data: VentasCreatePropertyPayload) =>
    apiClient
      .post<VentasPropertyDetail>('/properties', {
        ...data,
        ...ventasScope,
      })
      .then((r) => r.data),

  getList: (params: VentasListPropertiesParams) => {
    const {
      page = 1,
      limit = 10,
      search,
      propertyTypeId,
      districtId,
      listingStatus,
      minSalePrice,
      maxSalePrice,
    } = params
    const query: Record<string, string | number> = { ...ventasScope, page, limit }
    if (search?.trim()) query.search = search.trim()
    if (propertyTypeId) query.propertyTypeId = propertyTypeId
    if (districtId) query.districtId = districtId
    if (listingStatus) query.listingStatus = listingStatus
    if (minSalePrice != null && Number.isFinite(minSalePrice)) query.minSalePrice = minSalePrice
    if (maxSalePrice != null && Number.isFinite(maxSalePrice)) query.maxSalePrice = maxSalePrice
    return apiClient
      .get<VentasListPropertiesResponse>('/properties', { params: query })
      .then((r) => r.data)
  },

  getStats: () =>
    apiClient
      .get<VentasPropertyStats>('/properties/stats', { params: ventasScope })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<VentasPropertyDetail>('/properties/' + encodeURIComponent(id), {
        params: ventasScope,
      })
      .then((r) => r.data),

  update: (id: string, data: VentasUpdatePropertyPayload) =>
    apiClient
      .patch<VentasPropertyDetail>('/properties/' + encodeURIComponent(id), data, {
        params: ventasScope,
      })
      .then((r) => r.data),

  updateListingStatus: (id: string, listingStatus: 'AVAILABLE' | 'RESERVED' | 'SOLD') =>
    apiClient
      .patch<VentasPropertyDetail>(
        `/properties/${encodeURIComponent(id)}/listing-status`,
        { listingStatus },
        { params: ventasScope },
      )
      .then((r) => r.data),

  delete: (id: string): Promise<{ message: string }> =>
    apiClient
      .delete(`/properties/${encodeURIComponent(id)}`, { params: ventasScope })
      .then((r) => r.data),
}
