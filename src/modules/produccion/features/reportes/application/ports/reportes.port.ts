import { createServiceKey } from '@shared/application/ports/service-key'
import type { ProduccionReportesRepository } from '../../domain/repositories/reportes.repository'
export const produccionReportesRepositoryKey = createServiceKey<ProduccionReportesRepository>(
  'produccion.features.reportes.reportes',
)
