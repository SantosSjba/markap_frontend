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
