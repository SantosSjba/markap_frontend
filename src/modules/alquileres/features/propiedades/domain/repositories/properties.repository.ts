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
} from '../property.types'

export interface PropertiesRepository {
  getPropertyTypes: () => Promise<PropertyType[]>
  getDepartments: () => Promise<Department[]>
  getProvinces: (departmentId?: string) => Promise<Province[]>
  getDistricts: (provinceId?: string) => Promise<District[]>
  getOwners: (applicationSlug?: string, search?: string) => Promise<OwnerOption[]>
  create: (data: CreatePropertyPayload) => Promise<PropertyDetail>
  getList: (params: ListPropertiesParams) => Promise<ListPropertiesResponse>
  getStats: (applicationSlug?: string) => Promise<PropertyStats>
  getById: (id: string) => Promise<PropertyDetail>
  update: (id: string, data: UpdatePropertyPayload) => Promise<PropertyDetail>
  updateListingStatus: (
    id: string,
    listingStatus: 'RENTED' | 'EXPIRING' | 'MAINTENANCE',
  ) => Promise<PropertyDetail>
  delete: (id: string) => Promise<{ message: string }>
  uploadMedia: (
    id: string,
    file: File,
    kind: 'photo' | 'plan',
  ) => Promise<{
    mediaItem: import('../property.types').PropertyMediaItem
    downloadUrl: string | null
    mediaItems: import('../property.types').PropertyMediaItem[] | null
  }>
}
