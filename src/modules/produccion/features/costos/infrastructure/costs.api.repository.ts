import { apiClient } from '@core/api/apiClient'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import type {
  FurnitureCostingDetail,
  ListExtraCostsParams,
  ListLaborRatesParams,
  ProduccionExtraCostCatalogItem,
  ProduccionLaborRate,
  UpdateFurnitureCostingPayload,
  CostingSnapshot,
} from '../domain/costs.types'

const LABOR_BASE = '/produccion-labor-rates'
const EXTRA_BASE = '/produccion-extra-costs'
const COSTING_BASE = '/produccion-furniture-costing'

export const produccionCostsApi = {
  listLaborRates: (params: ListLaborRatesParams = {}) => {
    const sp = new URLSearchParams()
    sp.set('applicationSlug', PRODUCCION_APP_SLUG)
    sp.set('page', String(params.page ?? 1))
    sp.set('limit', String(params.limit ?? 50))
    if (params.search) sp.set('search', params.search)
    if (params.isActive !== undefined) sp.set('isActive', String(params.isActive))
    return apiClient
      .get<{ data: ProduccionLaborRate[]; total: number }>(`${LABOR_BASE}?${sp}`)
      .then((r) => r.data)
  },

  createLaborRate: (payload: Omit<ProduccionLaborRate, 'id' | 'updatedAt'>) =>
    apiClient
      .post<ProduccionLaborRate>(LABOR_BASE, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  updateLaborRate: (id: string, payload: Partial<ProduccionLaborRate>) =>
    apiClient
      .patch<ProduccionLaborRate>(`${LABOR_BASE}/${id}`, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  deleteLaborRate: (id: string) =>
    apiClient
      .delete(`${LABOR_BASE}/${id}`, { params: { applicationSlug: PRODUCCION_APP_SLUG } })
      .then(() => undefined),

  listExtraCosts: (params: ListExtraCostsParams = {}) => {
    const sp = new URLSearchParams()
    sp.set('applicationSlug', PRODUCCION_APP_SLUG)
    sp.set('page', String(params.page ?? 1))
    sp.set('limit', String(params.limit ?? 50))
    if (params.search) sp.set('search', params.search)
    if (params.isActive !== undefined) sp.set('isActive', String(params.isActive))
    return apiClient
      .get<{ data: ProduccionExtraCostCatalogItem[]; total: number }>(`${EXTRA_BASE}?${sp}`)
      .then((r) => r.data)
  },

  createExtraCost: (payload: {
    name: string
    defaultAmount: number
    description?: string | null
    isActive?: boolean
  }) =>
    apiClient
      .post<ProduccionExtraCostCatalogItem>(EXTRA_BASE, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  updateExtraCost: (id: string, payload: Partial<ProduccionExtraCostCatalogItem>) =>
    apiClient
      .patch<ProduccionExtraCostCatalogItem>(`${EXTRA_BASE}/${id}`, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  deleteExtraCost: (id: string) =>
    apiClient
      .delete(`${EXTRA_BASE}/${id}`, { params: { applicationSlug: PRODUCCION_APP_SLUG } })
      .then(() => undefined),

  getCosting: (furnitureId: string) =>
    apiClient
      .get<FurnitureCostingDetail>(`${COSTING_BASE}/${furnitureId}`, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  updateCosting: (furnitureId: string, payload: UpdateFurnitureCostingPayload) =>
    apiClient
      .patch<FurnitureCostingDetail>(`${COSTING_BASE}/${furnitureId}`, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  createSnapshot: (furnitureId: string, label?: string) =>
    apiClient
      .post<CostingSnapshot>(`${COSTING_BASE}/${furnitureId}/snapshots`, { label }, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),
}
