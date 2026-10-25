import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadClosingRepository } from '../../domain/repositories/contabilidad-closing.repository'
export const contabilidadClosingRepositoryKey = createServiceKey<ContabilidadClosingRepository>(
  'contabilidad.features.cierre.contabilidad-closing',
)
