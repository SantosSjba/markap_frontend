import { apiClient } from '@app/api/apiClient'

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
  overdueLevel: 'critical' | 'high' | 'moderate'
  totalOwed: number
  currency: string
  monthsOverdue: number
  maxDaysOverdue: number
  lastPaymentDate: string | null
  lastCommunicationDate: string | null
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

export const paymentsService = {
  getStats: (applicationSlug = 'alquileres') =>
    apiClient
      .get<PaymentStats>(`/payments/stats?applicationSlug=${applicationSlug}`)
      .then((r) => r.data),

  listPending: (params: ListPendingParams = {}) => {
    const p = new URLSearchParams()
    p.set('applicationSlug', params.applicationSlug ?? 'alquileres')
    if (params.search) p.set('search', params.search)
    if (params.status && params.status !== 'ALL') p.set('status', params.status)
    return apiClient
      .get<PendingPaymentItem[]>(`/payments/pending?${p.toString()}`)
      .then((r) => r.data)
  },

  registerPayment: (paymentId: string, data: RegisterPaymentPayload) =>
    apiClient.post(`/payments/${paymentId}/register`, data).then((r) => r.data),

  listHistory: (params: ListHistoryParams = {}) => {
    const p = new URLSearchParams()
    p.set('applicationSlug', params.applicationSlug ?? 'alquileres')
    p.set('page', String(params.page ?? 1))
    p.set('limit', String(params.limit ?? 20))
    if (params.search) p.set('search', params.search)
    if (params.periodYear) p.set('periodYear', String(params.periodYear))
    if (params.periodMonth) p.set('periodMonth', String(params.periodMonth))
    if (params.paymentMethod) p.set('paymentMethod', params.paymentMethod)
    return apiClient
      .get<ListPaymentHistoryResponse>(`/payments/history?${p.toString()}`)
      .then((r) => r.data)
  },

  listOverdue: (applicationSlug = 'alquileres', search?: string) => {
    const p = new URLSearchParams()
    p.set('applicationSlug', applicationSlug)
    if (search) p.set('search', search)
    return apiClient
      .get<OverduePaymentItem[]>(`/payments/overdue?${p.toString()}`)
      .then((r) => r.data)
  },
}
