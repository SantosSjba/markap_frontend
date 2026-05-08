export interface InteriorCatalogMaterialImageDto {
  id: string
  sortOrder: number
  url: string
}

export interface InteriorCatalogMaterialListItem {
  id: string
  code: string
  name: string
  category: string
  brand: string
  unit: string
  price: number
  stock: number
  imageCount: number
  updatedAt: string
}

export interface InteriorCatalogMaterialDetail {
  id: string
  code: string
  name: string
  category: string
  brand: string
  unit: string
  price: number
  stock: number
  technicalSheetUrl: string | null
  images: InteriorCatalogMaterialImageDto[]
  updatedAt: string
}

export interface CreateInteriorCatalogMaterialPayload {
  code: string
  name: string
  category: string
  brand: string
  unit: string
  price: number
  stock?: number
  technicalSheetUrl?: string | null
  imageUrls?: string[]
}

export interface UpdateInteriorCatalogMaterialPayload {
  name?: string
  category?: string
  brand?: string
  unit?: string
  price?: number
  stock?: number
  technicalSheetUrl?: string | null
  imageUrls?: string[]
}

export interface ListInteriorCatalogMaterialsParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  category?: string
}

export interface ListInteriorCatalogMaterialsResponse {
  data: InteriorCatalogMaterialListItem[]
  total: number
  page: number
  limit: number
}
