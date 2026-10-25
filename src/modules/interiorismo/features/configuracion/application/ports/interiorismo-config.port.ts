import { createServiceKey } from '@shared/application/ports/service-key'
import type { InteriorismoConfigRepository } from '../../domain/repositories/interiorismo-config.repository'
export const interiorismoConfigRepositoryKey = createServiceKey<InteriorismoConfigRepository>(
  'interiorismo.features.configuracion.interiorismo-config',
)
