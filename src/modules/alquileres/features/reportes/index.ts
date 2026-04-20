/**
 * Alquileres — reportes operativos y financieros.
 */
export { alquileresReportesRoutes } from './presentation/router'
export {
  reportKeys,
  useReportsSummary,
  useContractsExpiring,
  usePropertiesWithoutContract,
  useActiveClientsReport,
  useContractStatusSummary,
  useMonthlyMetrics,
  useRentalsByMonth,
  useFinancialDistributionReport,
} from './application/useReportes'
export type { ReportesRepository } from './domain/repositories/reportes.repository'
export { reportesApiRepository as reportesRepository } from './infrastructure/repositories/reportes.api.repository'
export { reportesApiRepository } from './infrastructure/repositories/reportes.api.repository'
export { ALQUILERES_REPORTS_SLUG } from './domain/reportes.types'
export type {
  ReportsSummary,
  ContractExpiringItem,
  PropertyWithoutContractItem,
  ActiveClientReportItem,
  ContractStatusSummary,
  MonthlyMetrics,
  RentalsByMonthItem,
  FinancialDistributionReportItem,
  RentalsByMonthParams,
  FinancialDistributionParams,
} from './domain/reportes.types'
