import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadTreasuryRepository } from '../../domain/repositories/contabilidad-treasury.repository'
export const contabilidadTreasuryRepositoryKey = createServiceKey<ContabilidadTreasuryRepository>(
  'contabilidad.features.tesoreria.contabilidad-treasury',
)
