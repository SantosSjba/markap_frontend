/**
 * Ventas — Clientes CRM (capas: domain / application / infrastructure / presentation).
 */
export * from './domain'
export * from './application'
export * from './presentation'
export type { VentasClientsRepository } from './domain/repositories/ventas-clients.repository'
export { ventasClientsApiRepository as ventasClientsRepository } from './infrastructure/repositories/ventas-clients.api.repository'
export { ventasClientsApiRepository } from './infrastructure/repositories/ventas-clients.api.repository'
