import { createServiceKey } from '@shared/application/ports/service-key'
import type { ContabilidadCpeLogRepository } from '../../domain/repositories/contabilidad-cpe-log.repository'
export const contabilidadCpeLogRepositoryKey = createServiceKey<ContabilidadCpeLogRepository>(
  'contabilidad.features.cpe-log.contabilidad-cpe-log',
)
