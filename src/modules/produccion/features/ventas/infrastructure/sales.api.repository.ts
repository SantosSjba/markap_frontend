import { apiClient } from '@core/api/apiClient'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import type {
  CreateDeliveryPayload,
  CreateQuotationPayload,
  ListDeliveriesParams,
  ListOrdersParams,
  ListQuotationsParams,
  ProduccionDeliveryDetail,
  ProduccionDeliveryListItem,
  ProduccionOrderDetail,
  ProduccionOrderListItem,
  ProduccionQuotationDetail,
  ProduccionQuotationListItem,
  SalesLinePayload,
} from '../domain/sales.types'

const QUOTATIONS_BASE = '/produccion-quotations'
const ORDERS_BASE = '/produccion-orders'
const DELIVERIES_BASE = '/produccion-deliveries'

function slugParams() {
  return { applicationSlug: PRODUCCION_APP_SLUG }
}

export const produccionSalesApi = {
  listQuotations: (params: ListQuotationsParams = {}) => {
    const sp = new URLSearchParams()
    sp.set('applicationSlug', PRODUCCION_APP_SLUG)
    sp.set('page', String(params.page ?? 1))
    sp.set('limit', String(params.limit ?? 20))
    if (params.search) sp.set('search', params.search)
    if (params.status) sp.set('status', params.status)
    if (params.clientId) sp.set('clientId', params.clientId)
    return apiClient
      .get<{ data: ProduccionQuotationListItem[]; total: number }>(`${QUOTATIONS_BASE}?${sp}`)
      .then((r) => r.data)
  },

  getQuotation: (id: string) =>
    apiClient
      .get<ProduccionQuotationDetail>(`${QUOTATIONS_BASE}/${id}`, { params: slugParams() })
      .then((r) => r.data),

  createQuotation: (payload: CreateQuotationPayload) =>
    apiClient
      .post<ProduccionQuotationDetail>(QUOTATIONS_BASE, payload, { params: slugParams() })
      .then((r) => r.data),

  updateQuotation: (id: string, payload: Partial<CreateQuotationPayload>) =>
    apiClient
      .patch<ProduccionQuotationDetail>(`${QUOTATIONS_BASE}/${id}`, payload, { params: slugParams() })
      .then((r) => r.data),

  sendQuotation: (id: string) =>
    apiClient
      .post<ProduccionQuotationDetail>(`${QUOTATIONS_BASE}/${id}/send`, {}, { params: slugParams() })
      .then((r) => r.data),

  acceptQuotation: (id: string) =>
    apiClient
      .post<ProduccionQuotationDetail>(`${QUOTATIONS_BASE}/${id}/accept`, {}, { params: slugParams() })
      .then((r) => r.data),

  rejectQuotation: (id: string) =>
    apiClient
      .post<ProduccionQuotationDetail>(`${QUOTATIONS_BASE}/${id}/reject`, {}, { params: slugParams() })
      .then((r) => r.data),

  convertQuotationToOrder: (id: string) =>
    apiClient
      .post<ProduccionOrderDetail>(`${QUOTATIONS_BASE}/${id}/convert-to-order`, {}, { params: slugParams() })
      .then((r) => r.data),

  deleteQuotation: (id: string) =>
    apiClient.delete(`${QUOTATIONS_BASE}/${id}`, { params: slugParams() }).then(() => undefined),

  fetchQuotationPdfHtml: (id: string) =>
    apiClient
      .get(`${QUOTATIONS_BASE}/${id}/pdf`, {
        params: slugParams(),
        responseType: 'text',
      })
      .then((r) => String(r.data)),

  listOrders: (params: ListOrdersParams = {}) => {
    const sp = new URLSearchParams()
    sp.set('applicationSlug', PRODUCCION_APP_SLUG)
    sp.set('page', String(params.page ?? 1))
    sp.set('limit', String(params.limit ?? 20))
    if (params.search) sp.set('search', params.search)
    if (params.status) sp.set('status', params.status)
    if (params.clientId) sp.set('clientId', params.clientId)
    return apiClient
      .get<{ data: ProduccionOrderListItem[]; total: number }>(`${ORDERS_BASE}?${sp}`)
      .then((r) => r.data)
  },

  getOrder: (id: string) =>
    apiClient.get<ProduccionOrderDetail>(`${ORDERS_BASE}/${id}`, { params: slugParams() }).then((r) => r.data),

  confirmOrder: (id: string) =>
    apiClient
      .post<ProduccionOrderDetail>(`${ORDERS_BASE}/${id}/confirm`, {}, { params: slugParams() })
      .then((r) => r.data),

  createWorkOrderFromOrder: (id: string) =>
    apiClient
      .post<ProduccionOrderDetail>(`${ORDERS_BASE}/${id}/create-work-order`, {}, { params: slugParams() })
      .then((r) => r.data),

  markOrderReady: (id: string) =>
    apiClient
      .post<ProduccionOrderDetail>(`${ORDERS_BASE}/${id}/mark-ready`, {}, { params: slugParams() })
      .then((r) => r.data),

  cancelOrder: (id: string) =>
    apiClient
      .post<ProduccionOrderDetail>(`${ORDERS_BASE}/${id}/cancel`, {}, { params: slugParams() })
      .then((r) => r.data),

  deleteOrder: (id: string) =>
    apiClient.delete(`${ORDERS_BASE}/${id}`, { params: slugParams() }).then(() => undefined),

  listDeliveries: (params: ListDeliveriesParams = {}) => {
    const sp = new URLSearchParams()
    sp.set('applicationSlug', PRODUCCION_APP_SLUG)
    sp.set('page', String(params.page ?? 1))
    sp.set('limit', String(params.limit ?? 20))
    if (params.search) sp.set('search', params.search)
    if (params.status) sp.set('status', params.status)
    if (params.orderId) sp.set('orderId', params.orderId)
    return apiClient
      .get<{ data: ProduccionDeliveryListItem[]; total: number }>(`${DELIVERIES_BASE}?${sp}`)
      .then((r) => r.data)
  },

  getDelivery: (id: string) =>
    apiClient
      .get<ProduccionDeliveryDetail>(`${DELIVERIES_BASE}/${id}`, { params: slugParams() })
      .then((r) => r.data),

  createDelivery: (payload: CreateDeliveryPayload) =>
    apiClient
      .post<ProduccionDeliveryDetail>(DELIVERIES_BASE, payload, { params: slugParams() })
      .then((r) => r.data),

  updateDelivery: (id: string, payload: Partial<CreateDeliveryPayload>) =>
    apiClient
      .patch<ProduccionDeliveryDetail>(`${DELIVERIES_BASE}/${id}`, payload, { params: slugParams() })
      .then((r) => r.data),

  completeDelivery: (id: string) =>
    apiClient
      .post<ProduccionDeliveryDetail>(`${DELIVERIES_BASE}/${id}/complete`, {}, { params: slugParams() })
      .then((r) => r.data),

  cancelDelivery: (id: string) =>
    apiClient
      .post<ProduccionDeliveryDetail>(`${DELIVERIES_BASE}/${id}/cancel`, {}, { params: slugParams() })
      .then((r) => r.data),

  deleteDelivery: (id: string) =>
    apiClient.delete(`${DELIVERIES_BASE}/${id}`, { params: slugParams() }).then(() => undefined),
}

export type { SalesLinePayload }
