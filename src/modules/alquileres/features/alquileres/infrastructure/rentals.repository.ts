import type { RentalsRepository } from '../domain/repositories/rentals.repository'
import { rentalsApiRepository } from './repositories/rentals.api.repository'

/** Instancia por defecto del puerto de contratos de alquiler (adaptador HTTP). */
export const rentalsRepository: RentalsRepository = rentalsApiRepository
