import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadCpeRepository } from '../../domain/repositories/contabilidad-cpe.repository'
export const contabilidadCpeRepositoryKey = createServiceKey<ContabilidadCpeRepository>(
  'contabilidad.features.facturacion-electronica.contabilidad-cpe',
)
