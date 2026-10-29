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
  currency: string
  stock: number
  imageCount: number
  suppliersCount: number
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
  currency: string
  description: string | null
  stock: number
  technicalSheetUrl: string | null
  images: InteriorCatalogMaterialImageDto[]
  suppliers: InteriorCatalogMaterialSupplierDto[]
  purchases: InteriorCatalogMaterialPurchaseDto[]
  updatedAt: string
}

export interface InteriorCatalogMaterialSupplierDto {
  linkId: string
  supplierId: string
  companyName: string
  ruc: string
  supplierSku: string | null
}

export interface InteriorCatalogMaterialPurchaseDto {
  id: string
  supplierId: string
  supplierName: string
  purchasedAt: string
  quantity: number
  unitPrice: number
  totalAmount: number
  currency: string
  invoiceRef: string | null
}

export interface InteriorCatalogMaterialStats {
  total: number
  categories: string[]
  outOfStock: number
  withoutSupplier: number
}

export interface CreateInteriorCatalogMaterialPayload {
  code: string
  name: string
  category: string
  brand: string
  unit: string
  price: number
  currency?: string
  description?: string | null
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
  currency?: string
  description?: string | null
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
  /** `OUT` = sin stock */
  stock?: 'OUT'
}

export interface ListInteriorCatalogMaterialsResponse {
  data: InteriorCatalogMaterialListItem[]
  total: number
  page: number
  limit: number
}
