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
