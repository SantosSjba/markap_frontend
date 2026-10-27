import type {
  BuyerPaymentRow,
  CommissionProfileRow,
  CommissionListParams,
  CommissionRow,
  CommissionStats,
  DocumentationCostRow,
  ProfitabilitySummary,
  UpdateCommissionBody,
} from '../finanzas.types'
export interface VentasFinanzasRepository {
  listBuyerPayments: (params: {
    page?: number
    limit?: number
    buyerClientId?: string
    saleClosingId?: string
    kind?: string
    displayStatus?: string
  }) => Promise<{ data: BuyerPaymentRow[]; total: number }>
  createBuyerPayment: (body: {
    saleClosingId: string
    kind: string
    amount: number
    currency?: string
    dueDate: string
    notes?: string | null
  }) => Promise<unknown>
  markBuyerPaymentPaid: (id: string, body?: { paidAt?: string | null }) => Promise<unknown>
  listCommissions: (params: Partial<CommissionListParams>) => Promise<{
    data: CommissionRow[]
    total: number
  }>
  getCommissionStats: () => Promise<CommissionStats>
  markCommissionPaid: (id: string, body?: { paidAt?: string | null }) => Promise<unknown>
  markCommissionPaymentPartPaid: (
    partId: string,
    body?: { paidAt?: string | null },
  ) => Promise<unknown>
  recalculateCommission: (id: string) => Promise<unknown>
  updateCommission: (id: string, body: UpdateCommissionBody) => Promise<CommissionRow>
  listCommissionProfiles: () => Promise<CommissionProfileRow[]>
  upsertCommissionProfile: (body: {
    agentId: string
    commissionPercent: number
  }) => Promise<unknown>
  listDocumentationCosts: (params: {
    page?: number
    limit?: number
    saleClosingId?: string
    buyerClientId?: string
  }) => Promise<{ data: DocumentationCostRow[]; total: number }>
  createDocumentationCost: (body: {
    saleClosingId: string
    costType: string
    amount: number
    currency?: string
    description?: string | null
    expenseDate?: string | null
  }) => Promise<unknown>
  getProfitability: (closingId: string) => Promise<ProfitabilitySummary>
}
