/**
 * Alquileres — inventario de propiedades.
 */
export * from './domain'
export * from './application'
export * from './presentation'
export type { PropertiesRepository } from './domain/repositories/properties.repository'
export { propertiesApiRepository as propertiesRepository } from './infrastructure/repositories/properties.api.repository'
export { propertiesApiRepository } from './infrastructure/repositories/properties.api.repository'
