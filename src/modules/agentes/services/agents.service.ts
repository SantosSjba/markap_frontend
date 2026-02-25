import { apiClient } from '@core/api'

export type AgentType = 'INTERNAL' | 'EXTERNAL'

export interface AgentListItem {
  id: string
  applicationId: string
  type: AgentType
  userId: string | null
  fullName: string
  email: string | null
  phone: string | null
  documentTypeId: string | null
  documentNumber: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  user?: { id: string; firstName: string; lastName: string } | null
  documentType?: { code: string; name: string } | null
}

export interface ListAgentsParams {
  applicationSlug?: string
  page?: number
  limit?: number
  search?: string
  type?: AgentType
  isActive?: boolean
}

export interface ListAgentsResult {
  data: AgentListItem[]
  total: number
  page: number
  limit: number
}

export interface CreateAgentPayload {
  applicationSlug?: string
  type: AgentType
  userId?: string | null
  fullName: string
  email?: string | null
  phone?: string | null
  documentTypeId?: string | null
  documentNumber?: string | null
}

export interface UpdateAgentPayload {
  type?: AgentType
  userId?: string | null
  fullName?: string
  email?: string | null
  phone?: string | null
  documentTypeId?: string | null
  documentNumber?: string | null
  isActive?: boolean
}

const BASE = '/agents'

export const agentsService = {
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
}
