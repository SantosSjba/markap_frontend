import type {
  VentasAgentPerformanceRow,
  VentasConversionReport,
  VentasFinancialFlowReport,
  VentasSalesByPeriodRow,
} from '../reportes.types'

export interface VentasReportesRepository {
  salesByPeriod: (params: { startDate?: string; endDate?: string; granularity?: string }) => Promise<VentasSalesByPeriodRow[]>
  agentPerformance: (params: { startDate?: string; endDate?: string }) => Promise<VentasAgentPerformanceRow[]>
  conversion: (params: { startDate?: string; endDate?: string }) => Promise<VentasConversionReport>
  financialFlow: (params: { startDate?: string; endDate?: string }) => Promise<VentasFinancialFlowReport>
}
