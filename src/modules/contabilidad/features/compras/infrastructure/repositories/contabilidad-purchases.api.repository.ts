import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_PURCHASES_APP_SLUG } from '../../domain/purchases.types'
import type { ContabilidadPurchasesRepository } from '../../domain/repositories/contabilidad-purchases.repository'

function qs(extra?: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_PURCHASES_APP_SLUG)
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== '') u.set(k, String(v))
    })
  }
  return u.toString()
}

export const contabilidadPurchasesApiRepository: ContabilidadPurchasesRepository = {
  listSuppliers: (params) =>
    apiClient
      .get(`/contabilidad-purchases/suppliers?${qs(params as Record<string, string | undefined>)}`)
      .then((r) => r.data),

  createSupplier: (body) =>
    apiClient.post(`/contabilidad-purchases/suppliers?${qs()}`, body).then((r) => r.data),

  updateSupplier: (id, body) =>
    apiClient.patch(`/contabilidad-purchases/suppliers/${id}?${qs()}`, body).then((r) => r.data),

  listInvoices: (params) =>
    apiClient
      .get(`/contabilidad-purchases/invoices?${qs(params as Record<string, string | undefined>)}`)
      .then((r) => r.data),

  getInvoice: (id) =>
    apiClient.get(`/contabilidad-purchases/invoices/${id}?${qs()}`).then((r) => r.data),

  createInvoice: (body) =>
    apiClient.post(`/contabilidad-purchases/invoices?${qs()}`, body).then((r) => r.data),

  cancelInvoice: (id) =>
    apiClient.post(`/contabilidad-purchases/invoices/${id}/cancel?${qs()}`).then((r) => r.data),

  listCreditNotes: (params) =>
    apiClient
      .get(`/contabilidad-purchases/credit-notes?${qs(params as Record<string, string | undefined>)}`)
      .then((r) => r.data),

  createCreditNote: (body) =>
    apiClient.post(`/contabilidad-purchases/credit-notes?${qs()}`, body).then((r) => r.data),

  listDebitNotes: (params) =>
    apiClient
      .get(`/contabilidad-purchases/debit-notes?${qs(params as Record<string, string | undefined>)}`)
      .then((r) => r.data),

  createDebitNote: (body) =>
    apiClient.post(`/contabilidad-purchases/debit-notes?${qs()}`, body).then((r) => r.data),

  listPayments: (params) =>
    apiClient
      .get(`/contabilidad-purchases/payments?${qs(params as Record<string, string | undefined>)}`)
      .then((r) => r.data),

  createPayment: (body) =>
    apiClient.post(`/contabilidad-purchases/payments?${qs()}`, body).then((r) => r.data),
}
