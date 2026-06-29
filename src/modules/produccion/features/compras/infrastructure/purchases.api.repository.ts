import { apiClient } from '@core/api/apiClient'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import type {
  CreatePurchaseOrderPayload,
  CreateSupplierPayload,
  ListPurchaseOrdersParams,
  ListSuppliersParams,
  ProduccionPurchaseOrderDetail,
  ProduccionPurchaseOrderListItem,
  ProduccionSupplierDetail,
  ProduccionSupplierListItem,
  ReceivePurchaseOrderPayload,
} from '../domain/purchases.types'

const SUPPLIERS_BASE = '/produccion-suppliers'
const ORDERS_BASE = '/produccion-purchase-orders'

export const produccionPurchasesApi = {
  listSuppliers: (params: ListSuppliersParams = {}) => {
    const sp = new URLSearchParams()
    sp.set('applicationSlug', PRODUCCION_APP_SLUG)
    sp.set('page', String(params.page ?? 1))
    sp.set('limit', String(params.limit ?? 20))
    if (params.search) sp.set('search', params.search)
    if (params.isActive !== undefined) sp.set('isActive', String(params.isActive))
    return apiClient
      .get<{ data: ProduccionSupplierListItem[]; total: number }>(`${SUPPLIERS_BASE}?${sp}`)
      .then((r) => r.data)
  },

  getSupplier: (id: string) =>
    apiClient
      .get<ProduccionSupplierDetail>(`${SUPPLIERS_BASE}/${id}`, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  createSupplier: (payload: CreateSupplierPayload) =>
    apiClient
      .post<ProduccionSupplierDetail>(SUPPLIERS_BASE, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  updateSupplier: (id: string, payload: Partial<CreateSupplierPayload>) =>
    apiClient
      .patch<ProduccionSupplierDetail>(`${SUPPLIERS_BASE}/${id}`, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  deleteSupplier: (id: string) =>
    apiClient
      .delete(`${SUPPLIERS_BASE}/${id}`, { params: { applicationSlug: PRODUCCION_APP_SLUG } })
      .then(() => undefined),

  linkSupplierMaterial: (
    supplierId: string,
    payload: { materialId: string; supplierSku?: string | null; notes?: string | null },
  ) =>
    apiClient
      .post<ProduccionSupplierDetail>(`${SUPPLIERS_BASE}/${supplierId}/material-links`, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  unlinkSupplierMaterial: (linkId: string) =>
    apiClient
      .delete(`${SUPPLIERS_BASE}/material-links/${linkId}`, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then(() => undefined),

  listPurchaseOrders: (params: ListPurchaseOrdersParams = {}) => {
    const sp = new URLSearchParams()
    sp.set('applicationSlug', PRODUCCION_APP_SLUG)
    sp.set('page', String(params.page ?? 1))
    sp.set('limit', String(params.limit ?? 20))
    if (params.search) sp.set('search', params.search)
    if (params.status) sp.set('status', params.status)
    if (params.supplierId) sp.set('supplierId', params.supplierId)
    return apiClient
      .get<{ data: ProduccionPurchaseOrderListItem[]; total: number }>(`${ORDERS_BASE}?${sp}`)
      .then((r) => r.data)
  },

  getPurchaseOrder: (id: string) =>
    apiClient
      .get<ProduccionPurchaseOrderDetail>(`${ORDERS_BASE}/${id}`, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  createPurchaseOrder: (payload: CreatePurchaseOrderPayload) =>
    apiClient
      .post<ProduccionPurchaseOrderDetail>(ORDERS_BASE, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  updatePurchaseOrder: (id: string, payload: Partial<CreatePurchaseOrderPayload>) =>
    apiClient
      .patch<ProduccionPurchaseOrderDetail>(`${ORDERS_BASE}/${id}`, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  sendPurchaseOrder: (id: string) =>
    apiClient
      .post<ProduccionPurchaseOrderDetail>(`${ORDERS_BASE}/${id}/send`, {}, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  receivePurchaseOrder: (id: string, payload: ReceivePurchaseOrderPayload) =>
    apiClient
      .post<ProduccionPurchaseOrderDetail>(`${ORDERS_BASE}/${id}/receive`, payload, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  cancelPurchaseOrder: (id: string) =>
    apiClient
      .post<ProduccionPurchaseOrderDetail>(`${ORDERS_BASE}/${id}/cancel`, {}, {
        params: { applicationSlug: PRODUCCION_APP_SLUG },
      })
      .then((r) => r.data),

  deletePurchaseOrder: (id: string) =>
    apiClient
      .delete(`${ORDERS_BASE}/${id}`, { params: { applicationSlug: PRODUCCION_APP_SLUG } })
      .then(() => undefined),
}
