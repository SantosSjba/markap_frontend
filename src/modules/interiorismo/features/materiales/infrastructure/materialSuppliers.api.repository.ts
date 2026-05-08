import { apiClient } from '@core/api/apiClient'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type { InteriorMaterialSuppliersRepository } from '../domain/repositories/materialSuppliers.repository'
import type {
  CreateInteriorMaterialSupplierPayload,
  InteriorSupplierDetail,
  LinkSupplierCatalogPayload,
  ListInteriorMaterialSuppliersParams,
  ListInteriorMaterialSuppliersResponse,
  RecordInteriorMaterialPurchasePayload,
  UpdateInteriorMaterialSupplierPayload,
} from '../domain/suppliers.types'

const BASE = '/interiorismo-material-suppliers'

export const interiorMaterialSuppliersApiRepository: InteriorMaterialSuppliersRepository = {
  getList: (params: ListInteriorMaterialSuppliersParams = {}) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', params.applicationSlug ?? INTERIORISMO_APP_SLUG)
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 20))
    if (params.search) searchParams.set('search', params.search)
    return apiClient
      .get<ListInteriorMaterialSuppliersResponse>(`${BASE}?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getById: (id: string) =>
    apiClient
      .get<InteriorSupplierDetail>(`${BASE}/${id}`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  create: (payload: CreateInteriorMaterialSupplierPayload) =>
    apiClient
      .post<InteriorSupplierDetail>(BASE, payload, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  update: (id: string, payload: UpdateInteriorMaterialSupplierPayload) =>
    apiClient
      .patch<InteriorSupplierDetail>(`${BASE}/${id}`, payload, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`, {
      params: { applicationSlug: INTERIORISMO_APP_SLUG },
    }).then(() => undefined),

  unlinkCatalogLink: (linkId: string) =>
    apiClient
      .delete(`${BASE}/catalog-links/${linkId}`, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then(() => undefined),

  linkCatalogMaterial: (supplierId: string, payload: LinkSupplierCatalogPayload) =>
    apiClient
      .post<InteriorSupplierDetail>(`${BASE}/${supplierId}/catalog-links`, payload, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),

  recordPurchase: (supplierId: string, payload: RecordInteriorMaterialPurchasePayload) =>
    apiClient
      .post<InteriorSupplierDetail>(`${BASE}/${supplierId}/purchases`, payload, {
        params: { applicationSlug: INTERIORISMO_APP_SLUG },
      })
      .then((r) => r.data),
}
