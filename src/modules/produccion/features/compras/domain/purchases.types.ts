export type ProduccionPurchaseOrderStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'

export interface ProduccionSupplierListItem {
  id: string
  companyName: string
  ruc: string
  contactName: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  linkedMaterialsCount: number
  updatedAt: string
}

export interface ProduccionSupplierMaterialLink {
  id: string
  materialId: string
  materialCode: string
  materialName: string
  category: string
  supplierSku: string | null
  notes: string | null
}

export interface ProduccionSupplierDetail {
  id: string
  companyName: string
  ruc: string
  contactName: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  notes: string | null
  materialLinks: ProduccionSupplierMaterialLink[]
  updatedAt: string
}

export interface ProduccionPurchaseOrderLine {
  id: string
  materialId: string
  materialCode: string
  materialName: string
  unit: string
  quantityOrdered: number
  quantityReceived: number
  quantityPending: number
  unitPrice: number
  lineTotal: number
}

export interface ProduccionPurchaseOrderListItem {
  id: string
  code: string
  status: ProduccionPurchaseOrderStatus
  supplierId: string
  supplierName: string
  orderedAt: string
  expectedAt: string | null
  linesCount: number
  totalAmount: number
  updatedAt: string
}

export interface ProduccionPurchaseOrderDetail {
  id: string
  code: string
  status: ProduccionPurchaseOrderStatus
  supplierId: string
  supplierName: string
  supplierRuc: string
  orderedAt: string
  expectedAt: string | null
  notes: string | null
  lines: ProduccionPurchaseOrderLine[]
  totalAmount: number
  updatedAt: string
}

export interface ListSuppliersParams {
  page?: number
  limit?: number
  search?: string
  isActive?: boolean
}

export interface ListPurchaseOrdersParams {
  page?: number
  limit?: number
  search?: string
  status?: ProduccionPurchaseOrderStatus
  supplierId?: string
}

export interface CreateSupplierPayload {
  companyName: string
  ruc: string
  contactName?: string | null
  phone?: string | null
  email?: string | null
  isActive?: boolean
  notes?: string | null
}

export interface PurchaseOrderLinePayload {
  materialId: string
  quantityOrdered: number
  unitPrice: number
}

export interface CreatePurchaseOrderPayload {
  supplierId: string
  orderedAt?: string
  expectedAt?: string | null
  notes?: string | null
  lines: PurchaseOrderLinePayload[]
}

export interface ReceivePurchaseOrderPayload {
  lines: { lineId: string; quantity: number }[]
  notes?: string | null
}
