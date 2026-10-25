import { createServiceKey } from '@shared/application/ports/service-key'
import type { ArquitecturaReportesRepository } from '../../domain/repositories/reportes.repository'
export const arquitecturaReportesRepositoryKey = createServiceKey<ArquitecturaReportesRepository>(
  'arquitectura.features.reportes.reportes',
)
