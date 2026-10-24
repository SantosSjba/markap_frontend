import type {
  VentasCreatePropertyPayload,
  VentasDepartment,
  VentasDistrict,
  VentasListPropertiesParams,
  VentasListPropertiesResponse,
  VentasOwnerOption,
  VentasPropertyDetail,
  VentasPropertyMediaItem,
  VentasPropertyStats,
  VentasPropertyType,
  VentasCurrency,
  VentasProvince,
  VentasUpdatePropertyPayload,
} from '../property.types'

export interface VentasPropertiesRepository {
  getPropertyTypes: () => Promise<VentasPropertyType[]>
  getCurrencies: () => Promise<VentasCurrency[]>
  getDepartments: () => Promise<VentasDepartment[]>
  getProvinces: (departmentId?: string) => Promise<VentasProvince[]>
  getDistricts: (provinceId?: string) => Promise<VentasDistrict[]>
  getOwners: (search?: string) => Promise<VentasOwnerOption[]>
  create: (data: VentasCreatePropertyPayload) => Promise<VentasPropertyDetail>
  getList: (params: VentasListPropertiesParams) => Promise<VentasListPropertiesResponse>
  getStats: () => Promise<VentasPropertyStats>
  getById: (id: string) => Promise<VentasPropertyDetail>
  update: (id: string, data: VentasUpdatePropertyPayload) => Promise<VentasPropertyDetail>
  updateListingStatus: (
    id: string,
    listingStatus: 'AVAILABLE' | 'RESERVED' | 'SOLD',
  ) => Promise<VentasPropertyDetail>
  delete: (id: string) => Promise<{ message: string }>
  uploadMedia: (
    id: string,
    file: File,
    kind: 'photo' | 'plan',
  ) => Promise<{
    mediaItem: VentasPropertyMediaItem
    downloadUrl: string | null
    mediaItems: VentasPropertyMediaItem[] | null
  }>
}
