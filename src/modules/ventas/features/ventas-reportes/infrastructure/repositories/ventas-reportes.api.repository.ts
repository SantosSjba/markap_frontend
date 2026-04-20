import { apiClient } from '@core/api/apiClient'
import {
  VENTAS_REPORTES_APP_SLUG,
  type VentasAgentPerformanceRow,
  type VentasConversionReport,
  type VentasFinancialFlowReport,
  type VentasSalesByPeriodRow,
} from '../../domain/reportes.types'
import type { VentasReportesRepository } from '../../domain/repositories/ventas-reportes.repository'

const scope = { applicationSlug: VENTAS_REPORTES_APP_SLUG } as const

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const ventasReportesApiRepository: VentasReportesRepository = {
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
