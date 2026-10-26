export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL'
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'DEPOSIT' | 'YAPE' | 'PLIN' | 'CHECK' | 'OTHER'

/** Monto en una moneda: soles y dólares no se suman */
export interface PaymentCurrencyAmount {
  currency: string
  amount: number
  count: number
}

export interface PaymentStats {
  /** Moneda principal (compatibilidad); el detalle por moneda va en `*ByCurrency` */
  totalPending: number
  totalCollected: number
  pendingCount: number
  overdueCount: number
  currency: string
  /** Saldo por cobrar de las cuotas del mes */
  pendingByCurrency: PaymentCurrencyAmount[]
  /** Cobrado en las cuotas del mes */
  collectedByCurrency: PaymentCurrencyAmount[]
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
  /** Totales de todo el filtro (no solo la página) */
  totalsByCurrency: PaymentCurrencyAmount[]
  page: number
  limit: number
}

export interface ListPendingResponse {
  data: PendingPaymentItem[]
  total: number
  page: number
  limit: number
}

/** Resumen de todos los contratos con atraso (no solo la página) */
export interface OverdueSummary {
  owedByCurrency: PaymentCurrencyAmount[]
  criticalCount: number
  withCommunicationCount: number
}

export interface ListOverdueResponse {
  data: OverduePaymentItem[]
  total: number
  page: number
  limit: number
  summary: OverdueSummary
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
  /** Solo las cuotas de un contrato */
  rentalId?: string
  page?: number
  limit?: number
}

export interface ListOverdueParams {
  applicationSlug?: string
  search?: string
  page?: number
  limit?: number
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
