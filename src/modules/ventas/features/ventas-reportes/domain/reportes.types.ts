export const VENTAS_REPORTES_APP_SLUG = 'ventas' as const

export interface VentasSalesByPeriodRow {
  period: string
  closingsCount: number
  totalAmount: number
}

export interface VentasAgentPerformanceRow {
  agentId: string
  agentName: string
  closingsCount: number
  totalSales: number
  totalCommissionAmount: number
}

export interface VentasConversionReport {
  opportunitiesCreated: number
  opportunitiesWon: number
  opportunitiesLost: number
  separationsCreated: number
  closingsCount: number
  conversionRatePercent: number
  activePipelineByStage: Record<string, number>
}

export interface VentasFinancialFlowReport {
  buyerPaymentsCollected: number
  buyerPaymentsPending: number
  documentationCostsTotal: number
  commissionsPaidAmount: number
  commissionsPendingAmount: number
  estimatedNetAfterCosts: number
}

export interface VentasReportesRangeParams {
  startDate: string
  endDate: string
  granularity?: string
}

// ── Resúmenes de la pantalla Reportes: montos siempre por moneda ──

export type VentasSummaryKind = 'sales' | 'agents' | 'conversion' | 'financial'

export interface VentasSummaryParams {
  startDate: string
  endDate: string
  /** `month` (2026-03) o `year` (2026) para el detalle por periodo */
  granularity: 'month' | 'year'
}

export interface CurrencyAmount {
  currency: string
  amount: number
}

export interface SalesSummary {
  closings: number
  byCurrency: {
    currency: string
    count: number
    total: number
    average: number
    listTotal: number
    discountPercent: number
  }[]
  periods: { period: string; closings: number; byCurrency: { currency: string; count: number; total: number }[] }[]
  rows: {
    id: string
    closedAt: string
    processId: string | null
    processCode: string | null
    propertyCode: string
    propertyAddress: string
    propertyType: string | null
    buyerName: string
    agentName: string | null
    finalPrice: number
    listPrice: number | null
    currency: string
    paymentType: string
    daysToClose: number | null
    /** Periodo de la venta: `2026-03` o `2026` */
    period: string
    /** Comisiones de asesores (neto), cada una en su moneda */
    commissions: { agentName: string; currency: string; total: number; paid: number }[]
  }[]
}

export interface AgentsSummaryRow {
  agentId: string
  agentName: string
  agentType: string | null
  processesCreated: number
  activeProcesses: number
  won: number
  lost: number
  winRate: number
  sales: { currency: string; count: number; total: number }[]
  commissions: { currency: string; total: number; paid: number; pending: number }[]
}

export interface AgentsSummary {
  agents: AgentsSummaryRow[]
}

export interface ConversionSummary {
  created: number
  won: number
  lost: number
  active: number
  separations: number
  conversionRate: number
  winRate: number
  avgDaysToClose: number | null
  stages: { stage: string; count: number; value: CurrencyAmount[] }[]
  periods: { period: string; created: number; won: number; lost: number }[]
  lostReasons: { reason: string; count: number }[]
}

export interface FinancialSummaryCurrency {
  currency: string
  salesVolume: number
  separations: number
  commissionsGenerated: number
  commissionsPaid: number
  commissionsPending: number
  documentationCosts: number
  buyerPaymentsCollected: number
  buyerPaymentsPending: number
}

export interface FinancialSummary {
  byCurrency: FinancialSummaryCurrency[]
  periods: {
    period: string
    byCurrency: { currency: string; sales: number; separations: number; commissionsPaid: number; costs: number }[]
  }[]
}

export interface VentasSummaryByKind {
  sales: SalesSummary
  agents: AgentsSummary
  conversion: ConversionSummary
  financial: FinancialSummary
}
