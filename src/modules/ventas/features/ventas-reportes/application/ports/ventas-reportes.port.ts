import { createServiceKey } from '@shared/application/ports/service-key'
import type { VentasReportesRepository } from '../../domain/repositories/ventas-reportes.repository'
export const ventasReportesRepositoryKey = createServiceKey<VentasReportesRepository>(
  'ventas.features.ventas-reportes.ventas-reportes',
)
