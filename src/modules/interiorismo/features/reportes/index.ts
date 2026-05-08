/**
 * Interiorismo — reportes consolidados (dependen del resto de módulos).
 */
export {
  interiorReportesKeys,
  invalidateInteriorReportesCache,
  useInteriorReportsDashboard,
} from './application/useInteriorReportes'
export type { InteriorReportesRangeParams, InteriorReportsDashboard } from './domain/reportes.types'
export type { InteriorReportesRepository } from './domain/repositories/reportes.repository'
export { interiorReportesApiRepository as interiorReportesRepository } from './infrastructure/repositories/reportes.api.repository'
export { interiorReportesApiRepository } from './infrastructure/repositories/reportes.api.repository'
export { interiorismoReportesRoutes } from './presentation/router'
