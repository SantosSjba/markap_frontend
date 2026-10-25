import { createServiceKey } from '@shared/application/ports/service-key'
import type { VentasAgentsRepository } from '../../domain/repositories/ventas-agents.repository'
export const ventasAgentsRepositoryKey = createServiceKey<VentasAgentsRepository>(
  'ventas.features.agentes.ventas-agents',
)
