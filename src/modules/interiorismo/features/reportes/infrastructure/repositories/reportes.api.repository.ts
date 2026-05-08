import { apiClient } from '@core/api/apiClient'
import { INTERIORISMO_APP_SLUG } from '@modules/interiorismo/config/app.constants'
import type { InteriorReportsDashboard } from '../../domain/reportes.types'
import type { InteriorReportesRepository } from '../../domain/repositories/reportes.repository'

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const interiorReportesApiRepository: InteriorReportesRepository = {
  getDashboard: ({ applicationSlug = INTERIORISMO_APP_SLUG, startDate, endDate }) =>
    apiClient
      .get<InteriorReportsDashboard>(
        `/interiorismo-reports/dashboard?${qs({
          applicationSlug,
          startDate,
          endDate,
        })}`,
      )
      .then((r) => r.data),
}
