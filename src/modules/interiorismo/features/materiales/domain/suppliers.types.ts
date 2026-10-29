export interface InteriorSupplierListItem {
  id: string
  companyName: string
  ruc: string
  contactName: string | null
  phone: string | null
  email: string | null
  linkedMaterialsCount: number
  projectItemsCount: number
  lastPurchaseAt: string | null
  updatedAt: string
}

export interface InteriorSupplierCatalogLinkDto {
  id: string
  catalogMaterialId: string
  materialCode: string
  materialName: string
  category: string
  supplierSku: string | null
  notes: string | null
}

export interface InteriorMaterialPurchaseDto {
  id: string
  catalogMaterialId: string | null
  materialCode: string | null
  materialName: string | null
  purchasedAt: string
  quantity: number
  unitPrice: number
  totalAmount: number
  currency: string
  invoiceRef: string | null
  notes: string | null
}

/** Partida de un presupuesto de proyecto comprada a este proveedor */
export interface InteriorSupplierProjectItemDto {
  rowId: string
  description: string
  status: string
  cost: number | null
  actualCost: number | null
  paid: number
  currency: string
  project: { id: string; code: string; name: string }
}

export interface InteriorSupplierStats {
  total: number
  withMaterials: number
  withProjects: number
  purchasedThisMonth: { currency: string; amount: number }[]
}

export interface InteriorSupplierDetail {
  id: string
  companyName: string
  ruc: string
  contactName: string | null
  phone: string | null
  email: string | null
  catalogLinks: InteriorSupplierCatalogLinkDto[]
  purchases: InteriorMaterialPurchaseDto[]
  projectItems: InteriorSupplierProjectItemDto[]
  updatedAt: string
}

export interface CreateInteriorMaterialSupplierPayload {
  companyName: string
  ruc: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
}

export interface UpdateInteriorMaterialSupplierPayload {
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

export interface RecordInteriorMaterialPurchasePayload {
  catalogMaterialId?: string | null
  purchasedAt: string
  quantity: number
  unitPrice: number
  currency?: string
  invoiceRef?: string | null
  notes?: string | null
}

export interface ListInteriorMaterialSuppliersParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
}

export interface ListInteriorMaterialSuppliersResponse {
  data: InteriorSupplierListItem[]
  total: number
  page: number
  limit: number
}
