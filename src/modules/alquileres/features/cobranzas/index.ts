/**
 * Alquileres — cobranzas y pagos.
 */
export { cobranzasRoutes } from './presentation/router'
export {
  paymentKeys,
  usePaymentStats,
  usePendingPayments,
  usePaymentHistory,
  useOverduePayments,
  useRegisterPayment,
  useSaveCommunicationNote,
} from './application/usePayments'
export type { PaymentsRepository } from './domain/repositories/payments.repository'
export { paymentsApiRepository as paymentsRepository } from './infrastructure/repositories/payments.api.repository'
export { paymentsApiRepository } from './infrastructure/repositories/payments.api.repository'
export type {
  PaymentStatus,
  PaymentMethod,
  PaymentStats,
  PendingPaymentItem,
  PaymentHistoryItem,
  ListPaymentHistoryResponse,
  OverduePaymentItem,
  RegisterPaymentPayload,
  ListPendingParams,
  ListHistoryParams,
} from './domain/payment.types'
