import { apiClient } from '@core/api/apiClient'
import type {
  ListHistoryParams,
  ListPaymentHistoryResponse,
  ListPendingParams,
  OverduePaymentItem,
  PaymentStats,
  PendingPaymentItem,
  RegisterPaymentPayload,
} from '../domain/payment.types'

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
    return apiClient.get<PendingPaymentItem[]>(`/payments/pending?${p.toString()}`).then((r) => r.data)
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
    return apiClient.get<OverduePaymentItem[]>(`/payments/overdue?${p.toString()}`).then((r) => r.data)
  },

  saveCommunicationNote: (rentalId: string, note: string): Promise<{ message: string }> =>
    apiClient.patch(`/rentals/${rentalId}/communication-note`, { note }).then((r) => r.data),
}
