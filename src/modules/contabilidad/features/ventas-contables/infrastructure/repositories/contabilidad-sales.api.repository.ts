import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_SALES_APP_SLUG } from '../../domain/sales.types'
import type { ContabilidadSalesRepository } from '../../domain/repositories/contabilidad-sales.repository'

function qs(extra?: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_SALES_APP_SLUG)
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== '') u.set(k, String(v))
    })
  }
  return u.toString()
}

export const contabilidadSalesApiRepository: ContabilidadSalesRepository = {
  listCustomers: (params) =>
    apiClient.get(`/contabilidad-sales/customers?${qs(params as Record<string, string | undefined>)}`).then((r) => r.data),

  createCustomer: (body) =>
    apiClient.post(`/contabilidad-sales/customers?${qs()}`, body).then((r) => r.data),

  updateCustomer: (id, body) =>
    apiClient.patch(`/contabilidad-sales/customers/${id}?${qs()}`, body).then((r) => r.data),

  listInvoices: (params) =>
    apiClient.get(`/contabilidad-sales/invoices?${qs(params as Record<string, string | undefined>)}`).then((r) => r.data),

  createInvoice: (body) =>
    apiClient.post(`/contabilidad-sales/invoices?${qs()}`, body).then((r) => r.data),

  cancelInvoice: (id) =>
    apiClient.post(`/contabilidad-sales/invoices/${id}/cancel?${qs()}`).then((r) => r.data),

  listCreditNotes: (params) =>
    apiClient.get(`/contabilidad-sales/credit-notes?${qs(params as Record<string, string | undefined>)}`).then((r) => r.data),

  createCreditNote: (body) =>
    apiClient.post(`/contabilidad-sales/credit-notes?${qs()}`, body).then((r) => r.data),

  listCollections: (params) =>
    apiClient.get(`/contabilidad-sales/collections?${qs(params as Record<string, string | undefined>)}`).then((r) => r.data),

  createCollection: (body) =>
    apiClient.post(`/contabilidad-sales/collections?${qs()}`, body).then((r) => r.data),
}
