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
    property: { id: string; code: string; addressLine: string }
  }
}

export interface CommissionRow {
  id: string
  amount: number
  percentApplied: number | null
  status: string
  paidAt: string | null
  agent: { id: string; fullName: string }
  closing: {
    id: string
    finalPrice: number
    closedAt: string
    buyer: { id: string; fullName: string }
    property: { id: string; code: string; addressLine: string }
  }
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
    property: { id: string; code: string }
  }
}

export interface ProfitabilitySummary {
  closingId: string
  finalPrice: number
  buyer: { id: string; fullName: string }
  property: { id: string; code: string }
  documentationCostsTotal: number
  commissionAmount: number
  commissionStatus: string | null
  netEstimated: number
}
