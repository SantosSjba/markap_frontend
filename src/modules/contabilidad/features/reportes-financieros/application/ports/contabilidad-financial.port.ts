import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadFinancialRepository } from '../../domain/repositories/contabilidad-financial.repository'
export const contabilidadFinancialRepositoryKey = createServiceKey<ContabilidadFinancialRepository>(
  'contabilidad.features.reportes-financieros.contabilidad-financial',
)
