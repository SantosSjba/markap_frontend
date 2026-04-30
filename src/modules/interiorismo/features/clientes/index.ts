/**
 * Clientes de Interiorismo (API `/clients` con `applicationSlug` interiorismo).
 */
export * from './domain'
export * from './application'
export * from './presentation'
export type { InteriorClientsRepository } from './domain/repositories/clients.repository'
export { interiorClientsApiRepository as interiorClientsRepository } from './infrastructure/repositories/clients.api.repository'
