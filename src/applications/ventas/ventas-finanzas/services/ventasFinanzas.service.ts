import { apiClient } from '@app/api/apiClient'

const scope = { applicationSlug: 'ventas' } as const

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

function qs(params: Record<string, string | number | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const ventasFinanzasService = {
  listBuyerPayments: (params: {
    page?: number
    limit?: number
    buyerClientId?: string
    kind?: string
    displayStatus?: string
  }) =>
    apiClient
      .get<{ data: BuyerPaymentRow[]; total: number }>(
        `/ventas-finanzas/buyer-payments?${qs({ ...scope, ...params })}`,
      )
      .then((r) => r.data),

  createBuyerPayment: (body: {
    saleClosingId: string
    kind: string
    amount: number
    currency?: string
    dueDate: string
    notes?: string | null
  }) =>
    apiClient
      .post(`/ventas-finanzas/buyer-payments?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  markBuyerPaymentPaid: (id: string, body?: { paidAt?: string | null }) =>
    apiClient
      .patch(
        `/ventas-finanzas/buyer-payments/${encodeURIComponent(id)}/mark-paid?${qs({ ...scope })}`,
        body ?? {},
      )
      .then((r) => r.data),

  listCommissions: (params: { page?: number; limit?: number; status?: string; agentId?: string }) =>
    apiClient
      .get<{ data: CommissionRow[]; total: number }>(
        `/ventas-finanzas/commissions?${qs({ ...scope, ...params })}`,
      )
      .then((r) => r.data),

  markCommissionPaid: (id: string, body?: { paidAt?: string | null }) =>
    apiClient
      .patch(
        `/ventas-finanzas/commissions/${encodeURIComponent(id)}/mark-paid?${qs({ ...scope })}`,
        body ?? {},
      )
      .then((r) => r.data),

  recalculateCommission: (id: string) =>
    apiClient
      .post(
        `/ventas-finanzas/commissions/${encodeURIComponent(id)}/recalculate-from-profile?${qs({ ...scope })}`,
      )
      .then((r) => r.data),

  listCommissionProfiles: () =>
    apiClient
      .get<CommissionProfileRow[]>(`/ventas-finanzas/agent-commission-profiles?${qs({ ...scope })}`)
      .then((r) => r.data),

  upsertCommissionProfile: (body: { agentId: string; commissionPercent: number }) =>
    apiClient
      .put(`/ventas-finanzas/agent-commission-profiles?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  listDocumentationCosts: (params: {
    page?: number
    limit?: number
    saleClosingId?: string
    buyerClientId?: string
  }) =>
    apiClient
      .get<{ data: DocumentationCostRow[]; total: number }>(
        `/ventas-finanzas/documentation-costs?${qs({ ...scope, ...params })}`,
      )
      .then((r) => r.data),

  createDocumentationCost: (body: {
    saleClosingId: string
    costType: string
    amount: number
    currency?: string
    description?: string | null
    expenseDate?: string | null
  }) =>
    apiClient
      .post(`/ventas-finanzas/documentation-costs?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  getProfitability: (closingId: string) =>
    apiClient
      .get<ProfitabilitySummary>(
        `/ventas-finanzas/closings/${encodeURIComponent(closingId)}/profitability?${qs({ ...scope })}`,
      )
      .then((r) => r.data),
}
