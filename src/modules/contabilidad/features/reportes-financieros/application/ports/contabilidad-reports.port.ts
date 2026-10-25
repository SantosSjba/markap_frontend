import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadReportsRepository } from '../../domain/repositories/contabilidad-reports.repository'
export const contabilidadReportsRepositoryKey = createServiceKey<ContabilidadReportsRepository>(
  'contabilidad.features.reportes-financieros.contabilidad-reports',
)
