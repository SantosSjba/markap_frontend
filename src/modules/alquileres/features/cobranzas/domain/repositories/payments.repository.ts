import type {
  ListHistoryParams,
  ListOverdueParams,
  ListOverdueResponse,
  ListPaymentHistoryResponse,
  ListPendingParams,
  ListPendingResponse,
  PaymentStats,
  RegisterPaymentPayload,
} from '../payment.types'
export interface PaymentsRepository {
  getStats: (applicationSlug?: string) => Promise<PaymentStats>
  listPending: (params?: ListPendingParams) => Promise<ListPendingResponse>
  registerPayment: (paymentId: string, data: RegisterPaymentPayload) => Promise<unknown>
  listHistory: (params?: ListHistoryParams) => Promise<ListPaymentHistoryResponse>
  listOverdue: (params?: ListOverdueParams) => Promise<ListOverdueResponse>
  saveCommunicationNote: (rentalId: string, note: string) => Promise<{ message: string }>
}
