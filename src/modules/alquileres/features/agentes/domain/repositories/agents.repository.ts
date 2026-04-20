import type {
  AgentListItem,
  CreateAgentPayload,
  ListAgentsParams,
  ListAgentsResult,
  UpdateAgentPayload,
} from '../agent.types'

export interface AgentsRepository {
  list(params: ListAgentsParams): Promise<ListAgentsResult>
  getById(id: string): Promise<AgentListItem>
  create(payload: CreateAgentPayload): Promise<AgentListItem>
  update(id: string, payload: UpdateAgentPayload): Promise<AgentListItem>
  delete(id: string): Promise<{ message: string }>
}
