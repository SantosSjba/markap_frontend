/**
 * Alquileres — configuración de alertas.
 */
export { configuracionRoutes } from './presentation/router'
export { useAlertConfig } from './application/useAlertConfig'
export type { AlertConfigRepository } from './domain/repositories/alert-config.repository'
export { alertConfigApiRepository as alertConfigRepository } from './infrastructure/repositories/alert-config.api.repository'
export { alertConfigApiRepository } from './infrastructure/repositories/alert-config.api.repository'
export type { AlertConfigData, UpsertAlertConfigPayload } from './domain/alert-config.types'
