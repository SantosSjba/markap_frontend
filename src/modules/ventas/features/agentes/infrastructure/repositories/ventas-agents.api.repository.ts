import { apiClient } from '@core/api/apiClient'
import {
  VENTAS_AGENTS_APPLICATION_SLUG,
  type CreateVentasAgentPayload,
  type ListVentasAgentsParams,
  type ListVentasAgentsResult,
  type UpdateVentasAgentPayload,
  type VentasAgentListItem,
} from '../../domain/agent.types'
import type { VentasAgentsRepository } from '../../domain/repositories/ventas-agents.repository'

const BASE = '/agents'

const ventasScope = { applicationSlug: VENTAS_AGENTS_APPLICATION_SLUG }

export const ventasAgentsApiRepository: VentasAgentsRepository = {
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
