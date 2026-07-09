import { apiClient } from '@core/api/apiClient'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import type { ArquitecturaMaterialSuppliersRepository } from '../domain/repositories/materialSuppliers.repository'
import type {
  CreateArquitecturaMaterialSupplierPayload,
  ArquitecturaSupplierDetail,
  LinkSupplierCatalogPayload,
  ListArquitecturaMaterialSuppliersParams,
  ListArquitecturaMaterialSuppliersResponse,
  RecordArquitecturaMaterialPurchasePayload,
  UpdateArquitecturaMaterialSupplierPayload,
} from '../domain/suppliers.types'

const BASE = '/arquitectura-material-suppliers'

export const arquitecturaMaterialSuppliersApiRepository: ArquitecturaMaterialSuppliersRepository = {
  getList: (params: ListArquitecturaMaterialSuppliersParams = {}) => {
    const searchParams = new URLSearchParams()
    searchParams.set('applicationSlug', params.applicationSlug ?? ARQUITECTURA_APP_SLUG)
    searchParams.set('page', String(params.page ?? 1))
    searchParams.set('limit', String(params.limit ?? 20))
    if (params.search) searchParams.set('search', params.search)
    return apiClient
      .get<ListArquitecturaMaterialSuppliersResponse>(`${BASE}?${searchParams.toString()}`)
      .then((r) => r.data)
  },

  getById: (id: string) =>
    apiClient
      .get<ArquitecturaSupplierDetail>(`${BASE}/${id}`, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),

  create: (payload: CreateArquitecturaMaterialSupplierPayload) =>
    apiClient
      .post<ArquitecturaSupplierDetail>(BASE, payload, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),

  update: (id: string, payload: UpdateArquitecturaMaterialSupplierPayload) =>
    apiClient
      .patch<ArquitecturaSupplierDetail>(`${BASE}/${id}`, payload, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`${BASE}/${id}`, {
      params: { applicationSlug: ARQUITECTURA_APP_SLUG },
    }).then(() => undefined),

  unlinkCatalogLink: (linkId: string) =>
    apiClient
      .delete(`${BASE}/catalog-links/${linkId}`, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then(() => undefined),

  linkCatalogMaterial: (supplierId: string, payload: LinkSupplierCatalogPayload) =>
    apiClient
      .post<ArquitecturaSupplierDetail>(`${BASE}/${supplierId}/catalog-links`, payload, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),

  recordPurchase: (supplierId: string, payload: RecordArquitecturaMaterialPurchasePayload) =>
    apiClient
      .post<ArquitecturaSupplierDetail>(`${BASE}/${supplierId}/purchases`, payload, {
        params: { applicationSlug: ARQUITECTURA_APP_SLUG },
      })
      .then((r) => r.data),
}
