import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadPeriodsRepository } from '../../domain/repositories/contabilidad-periods.repository'
export const contabilidadPeriodsRepositoryKey = createServiceKey<ContabilidadPeriodsRepository>(
  'contabilidad.features.periodos.contabilidad-periods',
)
