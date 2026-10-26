import { apiClient } from '@shared/infrastructure/http/api-client'
import type {
  ListHistoryParams,
  ListOverdueParams,
  ListOverdueResponse,
  ListPaymentHistoryResponse,
  ListPendingParams,
  ListPendingResponse,
  PaymentStats,
  RegisterPaymentPayload,
} from '../../domain/payment.types'
import type { PaymentsRepository } from '../../domain/repositories/payments.repository'
export const paymentsApiRepository: PaymentsRepository = {
  getStats: (applicationSlug = 'alquileres') =>
    apiClient
      .get<PaymentStats>(`/payments/stats?applicationSlug=${applicationSlug}`)
      .then((r) => r.data),

  listPending: (params: ListPendingParams = {}) => {
    const p = new URLSearchParams()
    p.set('applicationSlug', params.applicationSlug ?? 'alquileres')
    if (params.search) p.set('search', params.search)
    if (params.status && params.status !== 'ALL') p.set('status', params.status)
    if (params.rentalId) p.set('rentalId', params.rentalId)
    p.set('page', String(params.page ?? 1))
    p.set('limit', String(params.limit ?? 20))
    return apiClient
      .get<ListPendingResponse>(`/payments/pending?${p.toString()}`)
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

  listOverdue: (params: ListOverdueParams = {}) => {
    const p = new URLSearchParams()
    p.set('applicationSlug', params.applicationSlug ?? 'alquileres')
    if (params.search) p.set('search', params.search)
    p.set('page', String(params.page ?? 1))
    p.set('limit', String(params.limit ?? 10))
    return apiClient
      .get<ListOverdueResponse>(`/payments/overdue?${p.toString()}`)
      .then((r) => r.data)
  },

  saveCommunicationNote: (rentalId: string, note: string): Promise<{ message: string }> =>
    apiClient.patch(`/rentals/${rentalId}/communication-note`, { note }).then((r) => r.data),
}
