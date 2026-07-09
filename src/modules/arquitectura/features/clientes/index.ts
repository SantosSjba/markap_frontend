/**
 * Clientes de Arquitectura (API `/clients` con `applicationSlug` arquitectura).
 */
export * from './domain'
export * from './application'
export * from './presentation'
export type { ArquitecturaClientsRepository } from './domain/repositories/clients.repository'
export { arquitecturaClientsApiRepository as arquitecturaClientsRepository } from './infrastructure/repositories/clients.api.repository'
