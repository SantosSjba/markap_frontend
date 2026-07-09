import { apiClient } from '@core/api/apiClient'
import { ARQUITECTURA_APP_SLUG } from '@modules/arquitectura/config/app.constants'
import type { ArquitecturaReportsDashboard } from '../../domain/reportes.types'
import type { ArquitecturaReportesRepository } from '../../domain/repositories/reportes.repository'

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const arquitecturaReportesApiRepository: ArquitecturaReportesRepository = {
  getDashboard: ({ applicationSlug = ARQUITECTURA_APP_SLUG, startDate, endDate }) =>
    apiClient
      .get<ArquitecturaReportsDashboard>(
        `/arquitectura-reports/dashboard?${qs({
          applicationSlug,
          startDate,
          endDate,
        })}`,
      )
      .then((r) => r.data),
}
