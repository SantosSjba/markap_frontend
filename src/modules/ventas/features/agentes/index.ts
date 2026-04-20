/**
 * Módulo Ventas — Agentes (capas Clean + feature-driven).
 * Sin compartir implementación con `modules/alquileres/features/agentes`.
 */
export { ventasAgentesRoutes } from './presentation/router'
export {
  ventasAgentKeys,
  useVentasAgentsList,
  useVentasAgent,
  useVentasCreateAgent,
  useVentasUpdateAgent,
  useVentasDeleteAgent,
} from './application/useAgents'
export type {
  VentasAgentType,
  VentasAgentListItem,
  ListVentasAgentsParams,
  ListVentasAgentsResult,
  CreateVentasAgentPayload,
  UpdateVentasAgentPayload,
} from './domain/agent.types'
export { VENTAS_AGENTS_APPLICATION_SLUG } from './domain/agent.types'
export { ventasAgentsService } from './infrastructure/agents.service'
export {
  ventasAgentCreateFormSchema,
  ventasAgentEditFormSchema,
} from './infrastructure/schemas/agentFormSchema'
