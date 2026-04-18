import { apiClient } from '@app/api/apiClient'

export const VENTAS_AGENTS_APPLICATION_SLUG = 'ventas' as const

export type VentasAgentType = 'INTERNAL' | 'EXTERNAL'

export interface VentasAgentListItem {
  id: string
  applicationId: string
  type: VentasAgentType
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

export interface ListVentasAgentsParams {
  page?: number
  limit?: number
  search?: string
  type?: VentasAgentType
  isActive?: boolean
}

export interface ListVentasAgentsResult {
  data: VentasAgentListItem[]
  total: number
  page: number
  limit: number
}

export interface CreateVentasAgentPayload {
  type: VentasAgentType
  userId?: string | null
  fullName: string
  email?: string | null
  phone?: string | null
  documentTypeId?: string | null
  documentNumber?: string | null
}

export interface UpdateVentasAgentPayload {
  type?: VentasAgentType
  userId?: string | null
  fullName?: string
  email?: string | null
  phone?: string | null
  documentTypeId?: string | null
  documentNumber?: string | null
  isActive?: boolean
}

const BASE = '/agents'

const ventasScope = { applicationSlug: VENTAS_AGENTS_APPLICATION_SLUG }

export const ventasAgentsService = {
  list(params: ListVentasAgentsParams): Promise<ListVentasAgentsResult> {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', VENTAS_AGENTS_APPLICATION_SLUG)
    if (params.page != null) searchParams.set('page', String(params.page))
    if (params.limit != null) searchParams.set('limit', String(params.limit))
    if (params.search) searchParams.set('search', params.search)
    if (params.type) searchParams.set('type', params.type)
    if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
    return apiClient.get(`${BASE}?${searchParams.toString()}`).then((r) => r.data)
  },

  getById(id: string): Promise<VentasAgentListItem> {
    return apiClient
      .get(`${BASE}/${encodeURIComponent(id)}`, { params: ventasScope })
      .then((r) => r.data)
  },

  create(payload: CreateVentasAgentPayload): Promise<VentasAgentListItem> {
    return apiClient
      .post(BASE, { ...payload, ...ventasScope })
      .then((r) => r.data)
  },

  update(id: string, payload: UpdateVentasAgentPayload): Promise<VentasAgentListItem> {
    return apiClient
      .patch(`${BASE}/${encodeURIComponent(id)}`, payload, { params: ventasScope })
      .then((r) => r.data)
  },

  delete(id: string): Promise<{ message: string }> {
    return apiClient
      .delete(`${BASE}/${encodeURIComponent(id)}`, { params: ventasScope })
      .then((r) => r.data)
  },
}
