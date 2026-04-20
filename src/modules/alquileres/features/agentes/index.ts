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
export type { AgentsRepository } from './domain/repositories/agents.repository'
export { agentsApiRepository as agentsRepository } from './infrastructure/repositories/agents.api.repository'
export { agentsApiRepository } from './infrastructure/repositories/agents.api.repository'
export type {
  AgentType,
  AgentListItem,
  ListAgentsParams,
  ListAgentsResult,
  CreateAgentPayload,
  UpdateAgentPayload,
} from './domain/agent.types'
