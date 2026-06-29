import { apiClient } from '@core/api/apiClient'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import type {
  CreateMaterialPayload,
  CreateMovementPayload,
  ListMaterialsParams,
  ListMovementsParams,
  ProduccionInventoryStats,
  ProduccionMaterial,
  ProduccionStockMovement,
  UpdateMaterialPayload,
} from '../domain/inventory.types'

const MATERIALS_BASE = '/produccion-materials'
const MOVEMENTS_BASE = '/produccion-stock-movements'

function materialsQuery(params: ListMaterialsParams = {}) {
  const sp = new URLSearchParams()
  sp.set('applicationSlug', PRODUCCION_APP_SLUG)
  sp.set('page', String(params.page ?? 1))
  sp.set('limit', String(params.limit ?? 20))
  if (params.search) sp.set('search', params.search)
  if (params.category) sp.set('category', params.category)
  if (params.isActive !== undefined) sp.set('isActive', String(params.isActive))
  if (params.lowStockOnly) sp.set('lowStockOnly', 'true')
  return sp.toString()
}

function movementsQuery(params: ListMovementsParams = {}) {
  const sp = new URLSearchParams()
  sp.set('applicationSlug', PRODUCCION_APP_SLUG)
  sp.set('page', String(params.page ?? 1))
  sp.set('limit', String(params.limit ?? 20))
  if (params.materialId) sp.set('materialId', params.materialId)
  if (params.movementType) sp.set('movementType', params.movementType)
  if (params.search) sp.set('search', params.search)
  return sp.toString()
}

export const produccionInventoryApi = {
  listMaterials: (params: ListMaterialsParams = {}) =>
    apiClient
      .get<{ data: ProduccionMaterial[]; total: number }>(`${MATERIALS_BASE}?${materialsQuery(params)}`)
      .then((r) => r.data),

  getStats: () =>
    apiClient
      .get<ProduccionInventoryStats>(`${MATERIALS_BASE}/stats`, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  getMaterial: (id: string) =>
    apiClient
      .get<ProduccionMaterial>(`${MATERIALS_BASE}/${id}`, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  createMaterial: (payload: CreateMaterialPayload) =>
    apiClient
      .post<ProduccionMaterial>(MATERIALS_BASE, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  updateMaterial: (id: string, payload: UpdateMaterialPayload) =>
    apiClient
      .patch<ProduccionMaterial>(`${MATERIALS_BASE}/${id}`, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  deleteMaterial: (id: string) =>
    apiClient
      .delete(`${MATERIALS_BASE}/${id}`, { params: { applicationSlug: PRODUCCION_APP_SLUG } })
      .then(() => undefined),

  listMovements: (params: ListMovementsParams = {}) =>
    apiClient
      .get<{ data: ProduccionStockMovement[]; total: number }>(`${MOVEMENTS_BASE}?${movementsQuery(params)}`)
      .then((r) => r.data),

  createMovement: (payload: CreateMovementPayload) =>
    apiClient
      .post<ProduccionStockMovement>(MOVEMENTS_BASE, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),
}
