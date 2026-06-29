import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_TAXES_APP_SLUG } from '../../domain/taxes.types'
import type { ContabilidadTaxesRepository } from '../../domain/repositories/contabilidad-taxes.repository'

function qs(extra?: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_TAXES_APP_SLUG)
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== '') u.set(k, String(v))
    })
  }
  return u.toString()
}

export const contabilidadTaxesApiRepository: ContabilidadTaxesRepository = {
  getDashboard: (periodId) =>
    apiClient.get(`/contabilidad-taxes/dashboard?${qs({ periodId })}`).then((r) => r.data),

  exportPdt621: (periodId) =>
    apiClient.get(`/contabilidad-taxes/pdt621-export?${qs({ periodId })}`).then((r) => r.data),

  listDetraccionRates: () =>
    apiClient.get(`/contabilidad-taxes/detraccion-rates?${qs()}`).then((r) => r.data),

  listDetracciones: (params) =>
    apiClient.get(`/contabilidad-taxes/detracciones?${qs(params as Record<string, string | undefined>)}`).then((r) => r.data),

  createDetraccion: (body) =>
    apiClient.post(`/contabilidad-taxes/detracciones?${qs()}`, body).then((r) => r.data),

  payDetraccion: (id, body) =>
    apiClient.post(`/contabilidad-taxes/detracciones/${id}/pay?${qs()}`, body).then((r) => r.data),

  listRetentions: (params) =>
    apiClient.get(`/contabilidad-taxes/retentions?${qs(params as Record<string, string | undefined>)}`).then((r) => r.data),

  createRetention: (body) =>
    apiClient.post(`/contabilidad-taxes/retentions?${qs()}`, body).then((r) => r.data),

  listPerceptions: (params) =>
    apiClient.get(`/contabilidad-taxes/perceptions?${qs(params as Record<string, string | undefined>)}`).then((r) => r.data),

  createPerception: (body) =>
    apiClient.post(`/contabilidad-taxes/perceptions?${qs()}`, body).then((r) => r.data),
}
