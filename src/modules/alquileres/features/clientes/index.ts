/**
 * Alquileres — clientes (CRM alquileres; independiente de ventas/clientes).
 */
export * from './domain'
export * from './application'
export * from './presentation'
export type { ClientsRepository } from './domain/repositories/clients.repository'
export { clientsApiRepository as clientsRepository } from './infrastructure/repositories/clients.api.repository'
export { clientsApiRepository } from './infrastructure/repositories/clients.api.repository'
