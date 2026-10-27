export const VENTAS_FINANZAS_APP_SLUG = 'ventas' as const

export interface BuyerPaymentRow {
  id: string
  kind: string
  amount: number
  currency: string
  dueDate: string
  paidAt: string | null
  status: string
  displayStatus: 'PENDING' | 'PAID' | 'OVERDUE'
  notes: string | null
  closing: {
    id: string
    finalPrice: number
    closedAt: string
    buyer: { id: string; fullName: string }
    property: { id: string; code: string; addressLine: string; saleCurrency?: string }
  }
}

export interface CommissionPaymentPartRow {
  id: string
  partNumber: number
  label: string | null
  amount: number
  dueDate: string | null
  status: string
  paidAt: string | null
}

export interface CommissionDeductibleRow {
  id: string
  deductibleType: string
  description: string | null
  amount: number
}

export type CommissionStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED'

export interface CommissionRow {
  id: string
  amount: number
  /** Moneda de la comisión: la del inmueble si es %, la elegida si es monto fijo */
  currency: string
  grossAmount?: number
  deductiblesTotal?: number
  netPayable?: number
  percentApplied: number | null
  status: CommissionStatus | string
  paidAt: string | null
  createdAt?: string
  calculationType?: 'PERCENT' | 'FIXED' | string
  paymentParts?: CommissionPaymentPartRow[]
  deductibles?: CommissionDeductibleRow[]
  agent: { id: string; fullName: string; type?: string }
  closing: {
    id: string
    finalPrice: number
    closedAt: string
    paymentType?: string
    buyer: { id: string; fullName: string }
    property: { id: string; code: string; addressLine: string; saleCurrency?: string | null }
  } | null
  saleProcess: {
    id: string
    code: string
    title?: string | null
    status: string
    pipelineStage?: string
    property: {
      id: string
      code: string
      addressLine: string
      salePrice?: number | null
      saleCurrency?: string | null
    }
    buyer: { id: string; fullName: string }
  } | null
}

export interface CommissionListParams {
  page: number
  limit: number
  status?: string
  agentId?: string
  search?: string
  currency?: string
}

/** Totales de una moneda: nunca se suman monedas distintas */
export interface CommissionCurrencyTotals {
  currency: string
  count: number
  netTotal: number
  paidNet: number
  pendingNet: number
}

export interface CommissionStats {
  total: number
  byStatus: Record<CommissionStatus, number>
  agentsWithPending: number
  byCurrency: CommissionCurrencyTotals[]
}

export interface CommissionProfileRow {
  id: string
  commissionPercent: number
  agent: { id: string; fullName: string; email: string | null }
}

export interface DocumentationCostRow {
  id: string
  costType: string
  description: string | null
  amount: number
  currency: string
  expenseDate: string
  closing: {
    id: string
    finalPrice: number
    buyer: { id: string; fullName: string }
    property: { id: string; code: string; saleCurrency?: string }
  }
}

export interface ProfitabilitySummary {
  closingId: string
  /** Moneda de la venta: precio, comisiones y costos que se restan van en ella */
  currency: string
  /** Separación aplicada a cuenta del precio */
  separationAmount: number
  /** Pagos del comprador programados (inicial y cuotas) y ya cobrados */
  buyerPaymentsScheduled: number
  buyerPaymentsPaid: number
  /** Precio final − separación − pagos programados */
  balanceToSchedule: number
  finalPrice: number
  buyer: { id: string; fullName: string }
  property: { id: string; code: string }
  documentationCostsTotal: number
  commissionAmount: number
  commissionStatus: string | null
  netEstimated: number
  /** Comisiones o costos en otra moneda: se informan aparte, no se restan */
  otherCurrencies: { currency: string; commissions: number; documentationCosts: number }[]
}

export interface UpdateCommissionBody {
  calculationType: 'PERCENT' | 'FIXED'
  percent?: number | null
  fixedAmount?: number | null
  /** Motivo del cambio (queda en el historial del proceso) */
  reason: string
}
