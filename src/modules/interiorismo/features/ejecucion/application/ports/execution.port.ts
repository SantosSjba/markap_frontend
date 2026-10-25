import { createServiceKey } from '@shared/application/ports/service-key'
import type { InteriorExecutionRepository } from '../../domain/repositories/execution.repository'
export const interiorExecutionRepositoryKey = createServiceKey<InteriorExecutionRepository>(
  'interiorismo.features.ejecucion.execution',
)
