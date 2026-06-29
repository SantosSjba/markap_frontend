export type ProduccionQuotationStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'
export type ProduccionOrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED'
export type ProduccionDeliveryStatus = 'SCHEDULED' | 'DELIVERED' | 'CANCELLED'

export interface SalesLinePayload {
  furnitureId: string
  quantity: number
  unitPrice: number
  notes?: string | null
}

export interface ProduccionQuotationLine {
  id: string
  furnitureId: string
  furnitureCode: string
  furnitureName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  notes: string | null
}

export interface ProduccionQuotationListItem {
  id: string
  code: string
  status: ProduccionQuotationStatus
  clientId: string
  clientName: string
  validUntil: string | null
  sentAt: string | null
  linesCount: number
  totalAmount: number
  updatedAt: string
}

export interface ProduccionQuotationDetail {
  id: string
  code: string
  status: ProduccionQuotationStatus
  clientId: string
  clientName: string
  validUntil: string | null
  sentAt: string | null
  notes: string | null
  lines: ProduccionQuotationLine[]
  totalAmount: number
  orderId: string | null
  updatedAt: string
}

export interface ProduccionOrderLine {
  id: string
  furnitureId: string
  furnitureCode: string
  furnitureName: string
  quantity: number
  unitPrice: number
  lineTotal: number
  notes: string | null
}

export interface ProduccionOrderListItem {
  id: string
  code: string
  status: ProduccionOrderStatus
  clientId: string
  clientName: string
  quotationId: string | null
  quotationCode: string | null
  workOrderId: string | null
  workOrderCode: string | null
  orderedAt: string
  linesCount: number
  totalAmount: number
  updatedAt: string
}

export interface ProduccionOrderDetail {
  id: string
  code: string
  status: ProduccionOrderStatus
  clientId: string
  clientName: string
  quotationId: string | null
  quotationCode: string | null
  workOrderId: string | null
  workOrderCode: string | null
  orderedAt: string
  notes: string | null
  lines: ProduccionOrderLine[]
  totalAmount: number
  updatedAt: string
}

export interface ProduccionDeliveryListItem {
  id: string
  code: string
  status: ProduccionDeliveryStatus
  orderId: string
  orderCode: string
  clientName: string
  scheduledAt: string | null
  deliveredAt: string | null
  recipientName: string | null
  updatedAt: string
}

export interface ProduccionDeliveryDetail {
  id: string
  code: string
  status: ProduccionDeliveryStatus
  orderId: string
  orderCode: string
  clientId: string
  clientName: string
  scheduledAt: string | null
  deliveredAt: string | null
  address: string | null
  recipientName: string | null
  notes: string | null
  updatedAt: string
}

export interface ListQuotationsParams {
  page?: number
  limit?: number
  search?: string
  status?: ProduccionQuotationStatus
  clientId?: string
}

export interface ListOrdersParams {
  page?: number
  limit?: number
  search?: string
  status?: ProduccionOrderStatus
  clientId?: string
}

export interface ListDeliveriesParams {
  page?: number
  limit?: number
  search?: string
  status?: ProduccionDeliveryStatus
  orderId?: string
}

export interface CreateQuotationPayload {
  clientId: string
  validUntil?: string | null
  notes?: string | null
  lines: SalesLinePayload[]
}

export interface CreateDeliveryPayload {
  orderId: string
  scheduledAt?: string | null
  address?: string | null
  recipientName?: string | null
  notes?: string | null
}
