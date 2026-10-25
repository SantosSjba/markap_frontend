import { createServiceKey } from '@shared/application/ports/service-key'
import type { AgentsRepository } from '../../domain/repositories/agents.repository'
export const agentsRepositoryKey = createServiceKey<AgentsRepository>(
  'alquileres.features.agentes.agents',
)
