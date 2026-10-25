import { createServiceKey } from '@shared/application/ports/service-key'
import type { InteriorReportesRepository } from '../../domain/repositories/reportes.repository'
export const interiorReportesRepositoryKey = createServiceKey<InteriorReportesRepository>(
  'interiorismo.features.reportes.reportes',
)
