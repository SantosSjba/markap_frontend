import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadSolRepository } from '../../domain/repositories/contabilidad-sol.repository'
export const contabilidadSolRepositoryKey = createServiceKey<ContabilidadSolRepository>(
  'contabilidad.features.declaraciones-sol.contabilidad-sol',
)
