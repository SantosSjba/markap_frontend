import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_PLE_APP_SLUG } from '../../domain/ple.types'
import type { ContabilidadPleRepository } from '../../domain/repositories/contabilidad-ple.repository'

function qs(extra?: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_PLE_APP_SLUG)
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== '') u.set(k, String(v))
    })
  }
  return u.toString()
}

export const contabilidadPleApiRepository: ContabilidadPleRepository = {
  listBooks: () =>
    apiClient.get(`/contabilidad-ple/books?${qs()}`).then((r) => r.data),

  generateBooks: (periodId, bookCodes) =>
    apiClient.post(`/contabilidad-ple/${periodId}/generate?${qs()}`, { bookCodes }).then((r) => r.data),

  generateBook: (periodId, bookCode) =>
    apiClient.get(`/contabilidad-ple/${periodId}/${bookCode}?${qs()}`).then((r) => r.data),

  getLibroMayor: (periodId, accountId) =>
    apiClient.get(`/contabilidad-ple/consulta/libro-mayor?${qs({ periodId, accountId })}`).then((r) => r.data),
}
