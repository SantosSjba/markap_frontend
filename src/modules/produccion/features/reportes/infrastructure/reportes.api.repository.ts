import type { ProduccionReportesRepository } from '../domain/repositories/reportes.repository'
import { apiClient } from '@shared/infrastructure/http/api-client'
import { PRODUCCION_APP_SLUG } from '../../../config/app.constants'
import type {
  ProduccionReportesRangeParams,
  ProduccionReportsDashboard,
} from '../domain/reportes.types'
const BASE = '/produccion-reports'

export const produccionReportesApi: ProduccionReportesRepository = {
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
