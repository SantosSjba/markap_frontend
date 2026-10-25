import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadConfigRepository } from '../../domain/repositories/contabilidad-config.repository'
export const contabilidadConfigRepositoryKey = createServiceKey<ContabilidadConfigRepository>(
  'contabilidad.features.configuracion.contabilidad-config',
)
