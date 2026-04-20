import { apiClient } from '@core/api/apiClient'
import type {
  AgentListItem,
  CreateAgentPayload,
  ListAgentsParams,
  ListAgentsResult,
  UpdateAgentPayload,
} from '../../domain/agent.types'
import type { AgentsRepository } from '../../domain/repositories/agents.repository'

const BASE = '/agents'

export const agentsApiRepository: AgentsRepository = {
  list(params: ListAgentsParams): Promise<ListAgentsResult> {
    const searchParams = new URLSearchParams()
    if (params.applicationSlug) searchParams.set('applicationSlug', params.applicationSlug)
    if (params.page != null) searchParams.set('page', String(params.page))
    if (params.limit != null) searchParams.set('limit', String(params.limit))
    if (params.search) searchParams.set('search', params.search)
    if (params.type) searchParams.set('type', params.type)
    if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
    return apiClient.get(`${BASE}?${searchParams.toString()}`).then((r) => r.data)
  },

  getById(id: string): Promise<AgentListItem> {
    return apiClient.get(`${BASE}/${id}`).then((r) => r.data)
  },

  create(payload: CreateAgentPayload): Promise<AgentListItem> {
    return apiClient.post(BASE, payload).then((r) => r.data)
  },

  update(id: string, payload: UpdateAgentPayload): Promise<AgentListItem> {
    return apiClient.patch(`${BASE}/${id}`, payload).then((r) => r.data)
  },

  delete(id: string): Promise<{ message: string }> {
    return apiClient.delete(`${BASE}/${id}`).then((r) => r.data)
  },
}
