export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'
export type PaymentMethod =
  | 'CASH'
  | 'TRANSFER'
  | 'DEPOSIT'
  | 'YAPE'
  | 'PLIN'
  | 'CHECK'
  | 'OTHER'

export interface PaymentStats {
  totalPending: number
  totalCollected: number
  pendingCount: number
  overdueCount: number
  currency: string
}

export interface PendingPaymentItem {
  paymentId: string
  rentalId: string
  rentalCode: string
  tenantId: string
  tenantName: string
  tenantHistoryNote: string | null
  propertyAddress: string
  ownerName: string
  periodYear: number
  periodMonth: number
  periodLabel: string
  dueDate: string
  daysOverdue: number
  amount: number
  currency: string
  status: PaymentStatus
}

export interface PaymentHistoryItem {
  paymentId: string
  rentalId: string
  rentalCode: string
  tenantName: string
  propertyAddress: string
  ownerName: string
  periodYear: number
  periodMonth: number
  periodLabel: string
  paidDate: string
  paidAmount: number
  currency: string
  paymentMethod: string
  referenceNumber: string | null
  notes: string | null
}

export interface ListPaymentHistoryResponse {
  data: PaymentHistoryItem[]
  total: number
  totalAmount: number
  page: number
  limit: number
}

export interface OverduePaymentItem {
  tenantId: string
  tenantName: string
  tenantDocument: string | null
  tenantPhone: string | null
  tenantEmail: string | null
  overdueLevel: 'critical' | 'high' | 'moderate'
  totalOwed: number
  currency: string
  monthsOverdue: number
  maxDaysOverdue: number
  lastPaymentDate: string | null
  lastCommunicationDate: string | null
  lastCommunicationNote: string | null
  propertyAddress: string
  ownerName: string
  rentalId: string
}

export interface RegisterPaymentPayload {
  paidDate: string
  paidAmount: number
  paymentMethod: PaymentMethod
  referenceNumber?: string | null
  notes?: string | null
}

export interface ListPendingParams {
  applicationSlug?: string
  search?: string
  status?: PaymentStatus | 'ALL'
}

export interface ListHistoryParams {
  applicationSlug?: string
  search?: string
  periodYear?: number
  periodMonth?: number
  paymentMethod?: string
  page?: number
  limit?: number
}
