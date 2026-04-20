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
export type { VentasReportesRangeParams } from './domain/reportes.types'
export { ventasReportesService } from './infrastructure/ventasReportes.service'
export type {
  VentasSalesByPeriodRow,
  VentasAgentPerformanceRow,
  VentasConversionReport,
  VentasFinancialFlowReport,
} from './domain/reportes.types'
export { ventasReportesRoutes } from './presentation/router'
