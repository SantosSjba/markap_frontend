import { createServiceKey } from '@shared/application/ports/service-key'
import type { ProduccionConfigRepository } from '../../domain/repositories/produccion-config.repository'
export const produccionConfigRepositoryKey = createServiceKey<ProduccionConfigRepository>(
  'produccion.features.configuracion.produccion-config',
)
