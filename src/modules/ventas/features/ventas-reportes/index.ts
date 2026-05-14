/**
 * Ventas — reportes consolidados.
 */
export {
  ventasReportesKeys,
  invalidateVentasReportesCache,
  useVentasSalesByPeriodReport,
  useVentasAgentPerformanceReport,
  useVentasConversionReport,
  useVentasFinancialFlowReport,
} from './application/useVentasReportes'
export type { VentasReportesHookOptions, VentasReportesRangeParams } from './application/useVentasReportes'
export type { VentasReportesRepository } from './domain/repositories/ventas-reportes.repository'
export { ventasReportesApiRepository as ventasReportesRepository } from './infrastructure/repositories/ventas-reportes.api.repository'
export { ventasReportesApiRepository } from './infrastructure/repositories/ventas-reportes.api.repository'
export type {
  VentasSalesByPeriodRow,
  VentasAgentPerformanceRow,
  VentasConversionReport,
  VentasFinancialFlowReport,
} from './domain/reportes.types'
export { ventasReportesRoutes } from './presentation/router'
