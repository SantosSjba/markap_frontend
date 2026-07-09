export interface ArquitecturaCatalogMaterialImageDto {
  id: string
  sortOrder: number
  url: string
}

export interface ArquitecturaCatalogMaterialListItem {
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

export interface ArquitecturaCatalogMaterialDetail {
  id: string
  code: string
  name: string
  category: string
  brand: string
  unit: string
  price: number
  stock: number
  technicalSheetUrl: string | null
  images: ArquitecturaCatalogMaterialImageDto[]
  updatedAt: string
}

export interface CreateArquitecturaCatalogMaterialPayload {
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

export interface UpdateArquitecturaCatalogMaterialPayload {
  name?: string
  category?: string
  brand?: string
  unit?: string
  price?: number
  stock?: number
  technicalSheetUrl?: string | null
  imageUrls?: string[]
}

export interface ListArquitecturaCatalogMaterialsParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  category?: string
}

export interface ListArquitecturaCatalogMaterialsResponse {
  data: ArquitecturaCatalogMaterialListItem[]
  total: number
  page: number
  limit: number
}
