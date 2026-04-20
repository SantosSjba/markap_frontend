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
export { paymentsService } from './infrastructure/payments.service'
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
