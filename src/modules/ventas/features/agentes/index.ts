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
export type { VentasAgentCreateFormValues, VentasAgentEditFormValues } from './domain/agent-form.types'
export { VENTAS_AGENTS_APPLICATION_SLUG } from './domain/agent.types'
export type { VentasAgentsRepository } from './domain/repositories/ventas-agents.repository'
export { ventasAgentsApiRepository as ventasAgentsRepository } from './infrastructure/repositories/ventas-agents.api.repository'
export { ventasAgentsApiRepository } from './infrastructure/repositories/ventas-agents.api.repository'
export {
  ventasAgentCreateFormSchema,
  ventasAgentEditFormSchema,
} from './infrastructure/schemas/agentFormSchema'
