import { apiClient } from '@core/api/apiClient'
import {
  VENTAS_APP_SLUG,
  type VentasCreatePropertyPayload,
  type VentasDepartment,
  type VentasDistrict,
  type VentasListPropertiesParams,
  type VentasListPropertiesResponse,
  type VentasOwnerOption,
  type VentasPropertyDetail,
  type VentasPropertyStats,
  type VentasPropertyType,
  type VentasProvince,
  type VentasUpdatePropertyPayload,
} from '../domain/property.types'

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
