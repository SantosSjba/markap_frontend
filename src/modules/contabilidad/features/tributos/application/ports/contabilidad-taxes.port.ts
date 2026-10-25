import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadTaxesRepository } from '../../domain/repositories/contabilidad-taxes.repository'
export const contabilidadTaxesRepositoryKey = createServiceKey<ContabilidadTaxesRepository>(
  'contabilidad.features.tributos.contabilidad-taxes',
)
