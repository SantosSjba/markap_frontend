import { createServiceKey } from '@shared/application/ports/service-key'
import type { RentalsRepository } from '../../domain/repositories/rentals.repository'
export const rentalsRepositoryKey = createServiceKey<RentalsRepository>(
  'alquileres.features.alquileres.rentals',
)
