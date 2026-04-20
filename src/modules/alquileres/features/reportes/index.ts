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
export { reportesService } from './infrastructure/reportes.service'
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
