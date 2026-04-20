import { apiClient } from '@app/api/apiClient'

const scope = { applicationSlug: 'ventas' } as const

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

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const ventasReportesService = {
  salesByPeriod: (params: { startDate?: string; endDate?: string; granularity?: string }) =>
    apiClient
      .get<VentasSalesByPeriodRow[]>(`/ventas-reports/sales-by-period?${qs({ ...scope, ...params })}`)
      .then((r) => r.data),

  agentPerformance: (params: { startDate?: string; endDate?: string }) =>
    apiClient
      .get<VentasAgentPerformanceRow[]>(
        `/ventas-reports/agent-performance?${qs({ ...scope, ...params })}`,
      )
      .then((r) => r.data),

  conversion: (params: { startDate?: string; endDate?: string }) =>
    apiClient
      .get<VentasConversionReport>(`/ventas-reports/conversion?${qs({ ...scope, ...params })}`)
      .then((r) => r.data),

  financialFlow: (params: { startDate?: string; endDate?: string }) =>
    apiClient
      .get<VentasFinancialFlowReport>(`/ventas-reports/financial-flow?${qs({ ...scope, ...params })}`)
      .then((r) => r.data),
}
