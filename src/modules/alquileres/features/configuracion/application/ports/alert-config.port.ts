import { createServiceKey } from '@shared/application/ports/service-key'
import type { AlertConfigRepository } from '../../domain/repositories/alert-config.repository'
export const alertConfigRepositoryKey = createServiceKey<AlertConfigRepository>(
  'alquileres.features.configuracion.alert-config',
)
