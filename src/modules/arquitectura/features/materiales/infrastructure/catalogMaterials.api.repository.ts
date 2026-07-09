import { apiClient } from '@core/api/apiClient'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import type { ArquitecturaCatalogMaterialsRepository } from '../domain/repositories/catalogMaterials.repository'
import type {
  CreateArquitecturaCatalogMaterialPayload,
  ArquitecturaCatalogMaterialDetail,
  ListArquitecturaCatalogMaterialsParams,
  ListArquitecturaCatalogMaterialsResponse,
  UpdateArquitecturaCatalogMaterialPayload,
} from '../domain/catalog.types'

const BASE = '/arquitectura-catalog-materials'

function slug(params?: ListArquitecturaCatalogMaterialsParams) {
  return params?.applicationSlug ?? ARQUITECTURA_APP_SLUG
}

export const arquitecturaCatalogMaterialsApiRepository: ArquitecturaCatalogMaterialsRepository = {
  getList: (params: ListArquitecturaCatalogMaterialsParams = {}) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', slug(params))
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 20))
    if (params.search) searchParams.set('search', params.search)
    if (params.category) searchParams.set('category', params.category)
    return apiClient
      .get<ListArquitecturaCatalogMaterialsResponse>(`${BASE}?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getById: (id: string) =>
    apiClient
      .get<ArquitecturaCatalogMaterialDetail>(`${BASE}/${id}`, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),

  create: (payload: CreateArquitecturaCatalogMaterialPayload) =>
    apiClient
      .post<ArquitecturaCatalogMaterialDetail>(BASE, payload, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),

  update: (id: string, payload: UpdateArquitecturaCatalogMaterialPayload) =>
    apiClient
      .patch<ArquitecturaCatalogMaterialDetail>(`${BASE}/${id}`, payload, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`, {
      params: { applicationSlug: ARQUITECTURA_APP_SLUG },
    }).then(() => undefined),
}
