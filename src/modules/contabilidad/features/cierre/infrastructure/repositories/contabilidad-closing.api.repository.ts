import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_CLOSING_APP_SLUG } from '../../domain/closing.types'
import type { ContabilidadClosingRepository } from '../../domain/repositories/contabilidad-closing.repository'

function qs() {
  return `applicationSlug=${CONTABILIDAD_CLOSING_APP_SLUG}`
}

export const contabilidadClosingApiRepository: ContabilidadClosingRepository = {
  getPreview: (periodId) =>
    apiClient.get(`/contabilidad-closing/${periodId}/preview?${qs()}`).then((r) => r.data),

  closePeriod: (periodId) =>
    apiClient.post(`/contabilidad-closing/${periodId}/close?${qs()}`).then((r) => r.data),
}
