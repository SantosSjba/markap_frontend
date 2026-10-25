import { createServiceKey } from '@shared/application/ports/service-key'
import type { ArquitecturaConfigRepository } from '../../domain/repositories/arquitectura-config.repository'
export const arquitecturaConfigRepositoryKey = createServiceKey<ArquitecturaConfigRepository>(
  'arquitectura.features.configuracion.arquitectura-config',
)
