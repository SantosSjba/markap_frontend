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
export { ventasConfigService } from './infrastructure/ventasConfig.service'
export type { VentasPipelineStageDTO, VentasConfigBootstrap } from './domain/config.types'
export { ventasConfiguracionRoutes } from './presentation/router'
