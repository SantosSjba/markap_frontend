/**
 * Ventas — inventario de propiedades (domain / application / infrastructure / presentation).
 */
export * from './domain'
export * from './application'
export * from './presentation'
export type { VentasPropertiesRepository } from './domain/repositories/ventas-properties.repository'
export { ventasPropertiesApiRepository as ventasPropertiesRepository } from './infrastructure/repositories/ventas-properties.api.repository'
export { ventasPropertiesApiRepository } from './infrastructure/repositories/ventas-properties.api.repository'
