import { apiClient } from '@core/api/apiClient'
import { getContabilidadApiScope } from '@modules/contabilidad/config/api-scope'
import type {
  ContabilidadPeriodDTO,
  ContabilidadPeriodsResponse,
} from '../../domain/period.types'
import type { ContabilidadPeriodsRepository } from '../../domain/repositories/contabilidad-periods.repository'

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries({ ...getContabilidadApiScope(), ...params }).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const contabilidadPeriodsApiRepository: ContabilidadPeriodsRepository = {
  list: (year) =>
    apiClient
      .get<ContabilidadPeriodsResponse>(
        `/contabilidad-periods?${qs({ year: year !== undefined ? String(year) : undefined })}`,
      )
      .then((r) => r.data),

  setStatus: (id, status) =>
    apiClient
      .patch<ContabilidadPeriodDTO>(`/contabilidad-periods/${id}/status?${qs({})}`, { status })
      .then((r) => r.data),
}
