/**
 * Alquileres — agentes (capas limpias; independiente de ventas/agentes).
 */
export { agentesRoutes } from './presentation/router'
export {
  useAgentsList,
  useAgent,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
} from './application/useAgents'
export { agentsService } from './infrastructure/agents.service'
export type {
  AgentType,
  AgentListItem,
  ListAgentsParams,
  ListAgentsResult,
  CreateAgentPayload,
  UpdateAgentPayload,
} from './domain/agent.types'
