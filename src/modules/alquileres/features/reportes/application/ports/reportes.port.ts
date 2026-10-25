import { createServiceKey } from '@shared/application/ports/service-key'
import type { ReportesRepository } from '../../domain/repositories/reportes.repository'
export const reportesRepositoryKey = createServiceKey<ReportesRepository>(
  'alquileres.features.reportes.reportes',
)
