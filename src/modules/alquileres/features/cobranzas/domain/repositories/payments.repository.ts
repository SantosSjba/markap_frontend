import type {
  ListHistoryParams,
  ListPaymentHistoryResponse,
  ListPendingParams,
  OverduePaymentItem,
  PaymentStats,
  PendingPaymentItem,
  RegisterPaymentPayload,
} from '../payment.types'

export interface PaymentsRepository {
  getStats: (applicationSlug?: string) => Promise<PaymentStats>
  listPending: (params?: ListPendingParams) => Promise<PendingPaymentItem[]>
  registerPayment: (paymentId: string, data: RegisterPaymentPayload) => Promise<unknown>
  listHistory: (params?: ListHistoryParams) => Promise<ListPaymentHistoryResponse>
  listOverdue: (applicationSlug?: string, search?: string) => Promise<OverduePaymentItem[]>
  saveCommunicationNote: (rentalId: string, note: string) => Promise<{ message: string }>
}
