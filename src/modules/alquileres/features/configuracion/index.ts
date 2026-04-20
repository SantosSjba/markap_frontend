/**
 * Alquileres — configuración de alertas.
 */
export { configuracionRoutes } from './presentation/router'
export { useAlertConfig } from './application/useAlertConfig'
export { alertConfigService } from './infrastructure/alert-config.service'
export type { AlertConfigData, UpsertAlertConfigPayload } from './domain/alert-config.types'
