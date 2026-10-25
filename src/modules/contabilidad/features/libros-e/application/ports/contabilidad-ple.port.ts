import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadPleRepository } from '../../domain/repositories/contabilidad-ple.repository'
export const contabilidadPleRepositoryKey = createServiceKey<ContabilidadPleRepository>(
  'contabilidad.features.libros-e.contabilidad-ple',
)
