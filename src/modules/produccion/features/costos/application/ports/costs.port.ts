import { createServiceKey } from '@shared/application/ports/service-key'
import type { ProduccionCostsRepository } from '../../domain/repositories/costs.repository'
export const produccionCostsRepositoryKey = createServiceKey<ProduccionCostsRepository>(
  'produccion.features.costos.costs',
)
