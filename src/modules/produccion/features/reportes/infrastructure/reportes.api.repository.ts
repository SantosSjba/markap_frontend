import { apiClient } from '@core/api/apiClient'
import { PRODUCCION_APP_SLUG } from '@modules/produccion/config/app.constants'
import type { ProduccionReportesRangeParams, ProduccionReportsDashboard } from '../domain/reportes.types'

const BASE = '/produccion-reports'

export const produccionReportesApi = {
  getDashboard: (params: ProduccionReportesRangeParams) =>
    apiClient
      .get<ProduccionReportsDashboard>(`${BASE}/dashboard`, {
        params: {
          applicationSlug: PRODUCCION_APP_SLUG,
          startDate: params.startDate,
          endDate: params.endDate,
          clientId: params.clientId || undefined,
          category: params.category || undefined,
        },
      })
      .then((r) => r.data),
}
