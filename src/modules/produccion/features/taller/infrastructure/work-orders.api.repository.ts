import { apiClient } from '@core/api/apiClient'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import type {
  CreateWorkOrderPayload,
  ListWorkOrdersParams,
  ProduccionWorkOrderDetail,
  ProduccionWorkOrderListItem,
  ProduccionWorkOrderStats,
} from '../domain/work-orders.types'

const BASE = '/produccion-work-orders'

function query(params: ListWorkOrdersParams = {}) {
  const sp = new URLSearchParams()
  sp.set('applicationSlug', PRODUCCION_APP_SLUG)
  sp.set('page', String(params.page ?? 1))
  sp.set('limit', String(params.limit ?? 20))
  if (params.search) sp.set('search', params.search)
  if (params.status) sp.set('status', params.status)
  if (params.stageKey) sp.set('stageKey', params.stageKey)
  if (params.clientId) sp.set('clientId', params.clientId)
  if (params.priority) sp.set('priority', params.priority)
  return sp.toString()
}

export const produccionWorkOrdersApi = {
  list: (params: ListWorkOrdersParams = {}) =>
    apiClient
      .get<{ data: ProduccionWorkOrderListItem[]; total: number }>(`${BASE}?${query(params)}`)
      .then((r) => r.data),

  getStats: () =>
    apiClient
      .get<ProduccionWorkOrderStats>(`${BASE}/stats`, { params: { applicationSlug: PRODUCCION_APP_SLUG } })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ProduccionWorkOrderDetail>(`${BASE}/${id}`, { params: { applicationSlug: PRODUCCION_APP_SLUG } })
      .then((r) => r.data),

  create: (payload: CreateWorkOrderPayload) =>
    apiClient
      .post<ProduccionWorkOrderDetail>(BASE, payload, { params: { applicationSlug: PRODUCCION_APP_SLUG } })
      .then((r) => r.data),

  update: (id: string, payload: Partial<CreateWorkOrderPayload>) =>
    apiClient
      .patch<ProduccionWorkOrderDetail>(`${BASE}/${id}`, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  start: (id: string) =>
    apiClient
      .post<ProduccionWorkOrderDetail>(`${BASE}/${id}/start`, {}, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  updateStage: (id: string, stageId: string, payload: { assignee?: string | null; notes?: string | null; markDone?: boolean }) =>
    apiClient
      .patch<ProduccionWorkOrderDetail>(`${BASE}/${id}/stages/${stageId}`, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  complete: (id: string) =>
    apiClient
      .post<ProduccionWorkOrderDetail>(`${BASE}/${id}/complete`, {}, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  cancel: (id: string) =>
    apiClient
      .post<ProduccionWorkOrderDetail>(`${BASE}/${id}/cancel`, {}, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  consumeMaterials: (id: string, items: { materialId: string; quantity: number; notes?: string | null }[]) =>
    apiClient
      .post<ProduccionWorkOrderDetail>(`${BASE}/${id}/consume-materials`, { items }, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`, { params: { applicationSlug: PRODUCCION_APP_SLUG } }).then(() => undefined),
}
