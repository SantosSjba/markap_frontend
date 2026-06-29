import { apiClient } from '@core/api/apiClient'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import type { ProduccionCatalogRepository } from '../domain/repositories/catalog.repository'
import type {
  CreateProduccionFurniturePayload,
  ListProduccionFurnitureParams,
  ListProduccionFurnitureResponse,
  ProduccionFurnitureDetail,
  ProduccionFurnitureStats,
  UpdateProduccionFurniturePayload,
} from '../domain/catalog.types'

const BASE = '/produccion-furniture'

function slug(params?: ListProduccionFurnitureParams) {
  return params?.applicationSlug ?? PRODUCCION_APP_SLUG
}

export const produccionCatalogApiRepository: ProduccionCatalogRepository = {
  getList: (params: ListProduccionFurnitureParams = {}) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', slug(params))
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 20))
    if (params.search) searchParams.set('search', params.search)
    if (params.category) searchParams.set('category', params.category)
    if (params.isActive !== undefined) searchParams.set('isActive', String(params.isActive))
    return apiClient
      .get<ListProduccionFurnitureResponse>(`${BASE}?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getStats: () =>
    apiClient
      .get<ProduccionFurnitureStats>(`${BASE}/stats`, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ProduccionFurnitureDetail>(`${BASE}/${id}`, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  create: (payload: CreateProduccionFurniturePayload) =>
    apiClient
      .post<ProduccionFurnitureDetail>(BASE, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  update: (id: string, payload: UpdateProduccionFurniturePayload) =>
    apiClient
      .patch<ProduccionFurnitureDetail>(`${BASE}/${id}`, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  delete: (id: string) =>
    apiClient
      .delete(`${BASE}/${id}`, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then(() => undefined),
}
