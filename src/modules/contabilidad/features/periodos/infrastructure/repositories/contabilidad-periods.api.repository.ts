import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_PERIOD_APP_SLUG } from '../../domain/period.types'
import type {
  ContabilidadPeriodDTO,
  ContabilidadPeriodsResponse,
} from '../../domain/period.types'
import type { ContabilidadPeriodsRepository } from '../../domain/repositories/contabilidad-periods.repository'

const scope = { applicationSlug: CONTABILIDAD_PERIOD_APP_SLUG } as const

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const contabilidadPeriodsApiRepository: ContabilidadPeriodsRepository = {
  list: (year) =>
    apiClient
      .get<ContabilidadPeriodsResponse>(
        `/contabilidad-periods?${qs({ ...scope, year: year !== undefined ? String(year) : undefined })}`,
      )
      .then((r) => r.data),

  setStatus: (id, status) =>
    apiClient
      .patch<ContabilidadPeriodDTO>(`/contabilidad-periods/${id}/status?${qs({ ...scope })}`, { status })
      .then((r) => r.data),
}
