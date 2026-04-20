import { apiClient } from '@core/api/apiClient'
import type {
  CreatePropertyPayload,
  Department,
  District,
  ListPropertiesParams,
  ListPropertiesResponse,
  OwnerOption,
  PropertyDetail,
  PropertyStats,
  PropertyType,
  Province,
  UpdatePropertyPayload,
} from '../domain/property.types'

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
    return apiClient.get<District[]>('/properties/districts', { params }).then((r) => r.data)
  },

  getOwners: (applicationSlug = 'alquileres', search?: string) => {
    const params: Record<string, string> = { applicationSlug }
    if (search?.trim()) params.search = search.trim()
    return apiClient.get<OwnerOption[]>('/properties/owners', { params }).then((r) => r.data)
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

  updateListingStatus: (id: string, listingStatus: 'RENTED' | 'EXPIRING' | 'MAINTENANCE') =>
    apiClient
      .patch<PropertyDetail>(`/properties/${encodeURIComponent(id)}/listing-status`, {
        listingStatus,
      })
      .then((r) => r.data),

  delete: (id: string): Promise<{ message: string }> =>
    apiClient.delete(`/properties/${encodeURIComponent(id)}`).then((r) => r.data),
}
