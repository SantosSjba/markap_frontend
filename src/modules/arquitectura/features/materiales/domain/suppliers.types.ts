export interface ArquitecturaSupplierListItem {
  id: string
  companyName: string
  ruc: string
  contactName: string | null
  phone: string | null
  email: string | null
  linkedMaterialsCount: number
  updatedAt: string
}

export interface ArquitecturaSupplierCatalogLinkDto {
  id: string
  catalogMaterialId: string
  materialCode: string
  materialName: string
  category: string
  supplierSku: string | null
  notes: string | null
}

export interface ArquitecturaMaterialPurchaseDto {
  id: string
  catalogMaterialId: string | null
  materialCode: string | null
  materialName: string | null
  purchasedAt: string
  quantity: number
  unitPrice: number
  totalAmount: number
  invoiceRef: string | null
  notes: string | null
}

export interface ArquitecturaSupplierDetail {
  id: string
  companyName: string
  ruc: string
  contactName: string | null
  phone: string | null
  email: string | null
  catalogLinks: ArquitecturaSupplierCatalogLinkDto[]
  purchases: ArquitecturaMaterialPurchaseDto[]
  updatedAt: string
}

export interface CreateArquitecturaMaterialSupplierPayload {
  companyName: string
  ruc: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
}

export interface UpdateArquitecturaMaterialSupplierPayload {
  companyName?: string
  ruc?: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
}

export interface LinkSupplierCatalogPayload {
  catalogMaterialId: string
  supplierSku?: string | null
  notes?: string | null
}

export interface RecordArquitecturaMaterialPurchasePayload {
  catalogMaterialId?: string | null
  purchasedAt: string
  quantity: number
  unitPrice: number
  invoiceRef?: string | null
  notes?: string | null
}

export interface ListArquitecturaMaterialSuppliersParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
}

export interface ListArquitecturaMaterialSuppliersResponse {
  data: ArquitecturaSupplierListItem[]
  total: number
  page: number
  limit: number
}
