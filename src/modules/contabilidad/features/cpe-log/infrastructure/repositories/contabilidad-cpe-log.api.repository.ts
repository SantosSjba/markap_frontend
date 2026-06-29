import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_CPE_LOG_APP_SLUG } from '../../domain/cpe-log.types'
import type { ContabilidadCpeLogRepository } from '../../domain/repositories/contabilidad-cpe-log.repository'

function qs(params: Record<string, string | undefined> = {}) {
  const parts = [`applicationSlug=${CONTABILIDAD_CPE_LOG_APP_SLUG}`]
  for (const [key, value] of Object.entries(params)) {
    if (value) parts.push(`${key}=${encodeURIComponent(value)}`)
  }
  return parts.join('&')
}

export const contabilidadCpeLogApiRepository: ContabilidadCpeLogRepository = {
  listLogs: (params) =>
    apiClient.get(`/contabilidad-extensions/electronic-document-logs?${qs(params)}`).then((r) => r.data),

  createLog: (body) =>
    apiClient.post(`/contabilidad-extensions/electronic-document-logs?${qs()}`, body).then((r) => r.data),
}
