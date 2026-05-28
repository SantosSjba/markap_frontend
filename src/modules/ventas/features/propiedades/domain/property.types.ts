/** Slug fijo: inventario de propiedades solo para la aplicación Ventas. */
export const VENTAS_APP_SLUG = 'ventas' as const

export interface VentasPropertyType {
  id: string
  name: string
  code: string
  isActive: boolean
}

export interface VentasCurrency {
  id: string
  code: string
  name: string
  symbol: string
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

export interface VentasPropertyOwnerSummary {
  id: string
  fullName: string
  documentNumber: string
  isPrimary: boolean
}

export type VentasPropertyMediaItem = { url: string; kind: 'photo' | 'plan' }

export interface VentasLocationCustom {
  country: string
  department: string
  province: string
  district: string
}

/** Alta de propiedad en inventario Ventas (sin campos de alquiler). */
export interface VentasCreatePropertyPayload {
  code: string
  propertyTypeId: string
  addressLine: string
  districtId: string
  locationCustom?: VentasLocationCustom | null
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
  ownerClientIds?: string[]
  salePrice?: number | null
  saleCurrency?: string
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
  locationCustom?: VentasLocationCustom | null
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
  owners?: VentasPropertyOwnerSummary[]
  monthlyRent: number | null
  maintenanceAmount: number | null
  depositMonths: number | null
  salePrice: number | null
  saleCurrency: string
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
  saleCurrency: string
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
