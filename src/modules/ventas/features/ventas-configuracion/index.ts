/**
 * Ventas — bootstrap de configuración (pipeline, numeración).
 */
export {
  ventasConfigKeys,
  invalidateVentasConfigCache,
  useVentasConfigBootstrap,
  useVentasPipelineStages,
  useVentasSavePipelineStages,
  useVentasSaveNumbering,
} from './application/useVentasConfig'
export type { VentasConfigRepository } from './domain/repositories/ventas-config.repository'
export { ventasConfigApiRepository as ventasConfigRepository } from './infrastructure/repositories/ventas-config.api.repository'
export { ventasConfigApiRepository } from './infrastructure/repositories/ventas-config.api.repository'
export type { VentasPipelineStageDTO, VentasConfigBootstrap } from './domain/config.types'
export { ventasConfiguracionRoutes } from './presentation/router'
