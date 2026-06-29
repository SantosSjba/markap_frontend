import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_INVENTORY_APP_SLUG } from '../../domain/inventory.types'
import type { ContabilidadInventoryRepository } from '../../domain/repositories/contabilidad-inventory.repository'

function qs(extra?: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_INVENTORY_APP_SLUG)
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== '') u.set(k, String(v))
    })
  }
  return u.toString()
}

export const contabilidadInventoryApiRepository: ContabilidadInventoryRepository = {
  getCatalog: () => apiClient.get(`/contabilidad-inventory/catalog?${qs()}`).then((r) => r.data),

  listItems: (params) =>
    apiClient.get(`/contabilidad-inventory/items?${qs(params)}`).then((r) => r.data),

  createItem: (body) =>
    apiClient.post(`/contabilidad-inventory/items?${qs()}`, body).then((r) => r.data),

  listMovements: (params) =>
    apiClient.get(`/contabilidad-inventory/movements?${qs(params)}`).then((r) => r.data),

  createMovement: (body) =>
    apiClient.post(`/contabilidad-inventory/movements?${qs()}`, body).then((r) => r.data),

  getKardex: (itemId) =>
    apiClient.get(`/contabilidad-inventory/items/${itemId}/kardex?${qs()}`).then((r) => r.data),

  getValuedBalance: () =>
    apiClient.get(`/contabilidad-inventory/valued-balance?${qs()}`).then((r) => r.data),
}
