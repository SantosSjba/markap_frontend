/**
 * Arquitectura — reportes consolidados (dependen del resto de módulos).
 */
export {
  arquitecturaReportesKeys,
  invalidateArquitecturaReportesCache,
  useArquitecturaReportsDashboard,
} from './application/useArquitecturaReportes'
export type { ArquitecturaReportesHookOptions } from './application/useArquitecturaReportes'
export type { ArquitecturaReportesRangeParams, ArquitecturaReportsDashboard } from './domain/reportes.types'
export type { ArquitecturaReportesRepository } from './domain/repositories/reportes.repository'
export { arquitecturaReportesApiRepository } from './infrastructure/repositories/reportes.api.repository'
export { arquitecturaReportesRoutes } from './presentation/router'
