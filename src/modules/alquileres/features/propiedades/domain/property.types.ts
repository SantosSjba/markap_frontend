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

export interface LocationCustom {
  country: string
  department: string
  province: string
  district: string
}

export interface CreatePropertyPayload {
  applicationSlug?: string
  code: string
  propertyTypeId: string
  addressLine: string
  districtId: string
  locationCustom?: LocationCustom | null
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
  locationCustom?: LocationCustom | null
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
