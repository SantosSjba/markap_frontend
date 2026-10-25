import { createServiceKey } from '@shared/application/ports/service-key'
import type { ArquitecturaExecutionRepository } from '../../domain/repositories/execution.repository'
export const arquitecturaExecutionRepositoryKey = createServiceKey<ArquitecturaExecutionRepository>(
  'arquitectura.features.ejecucion.execution',
)
