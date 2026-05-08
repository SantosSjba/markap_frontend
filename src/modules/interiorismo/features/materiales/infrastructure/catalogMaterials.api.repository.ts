import { apiClient } from '@core/api/apiClient'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type { InteriorCatalogMaterialsRepository } from '../domain/repositories/catalogMaterials.repository'
import type {
  CreateInteriorCatalogMaterialPayload,
  InteriorCatalogMaterialDetail,
  ListInteriorCatalogMaterialsParams,
  ListInteriorCatalogMaterialsResponse,
  UpdateInteriorCatalogMaterialPayload,
} from '../domain/catalog.types'

const BASE = '/interiorismo-catalog-materials'

function slug(params?: ListInteriorCatalogMaterialsParams) {
  return params?.applicationSlug ?? INTERIORISMO_APP_SLUG
}

export const interiorCatalogMaterialsApiRepository: InteriorCatalogMaterialsRepository = {
  getList: (params: ListInteriorCatalogMaterialsParams = {}) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', slug(params))
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 20))
    if (params.search) searchParams.set('search', params.search)
    if (params.category) searchParams.set('category', params.category)
    return apiClient
      .get<ListInteriorCatalogMaterialsResponse>(`${BASE}?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getById: (id: string) =>
    apiClient
      .get<InteriorCatalogMaterialDetail>(`${BASE}/${id}`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  create: (payload: CreateInteriorCatalogMaterialPayload) =>
    apiClient
      .post<InteriorCatalogMaterialDetail>(BASE, payload, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  update: (id: string, payload: UpdateInteriorCatalogMaterialPayload) =>
    apiClient
      .patch<InteriorCatalogMaterialDetail>(`${BASE}/${id}`, payload, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`, {
      params: { applicationSlug: INTERIORISMO_APP_SLUG },
    }).then(() => undefined),
}
