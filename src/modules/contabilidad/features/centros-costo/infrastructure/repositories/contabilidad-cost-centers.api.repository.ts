import { apiClient } from '@shared/infrastructure/http/api-client'
import { CONTABILIDAD_PERIOD_APP_SLUG } from '../../../periodos/domain/period.types'
import type { ContabilidadCostCenterDTO } from '../../domain/cost-center.types'
import type { ContabilidadCostCentersRepository } from '../../domain/repositories/contabilidad-cost-centers.repository'
const scope = { applicationSlug: CONTABILIDAD_PERIOD_APP_SLUG } as const

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const contabilidadCostCentersApiRepository: ContabilidadCostCentersRepository = {
  list: (search) =>
    apiClient
      .get<ContabilidadCostCenterDTO[]>(`/contabilidad-cost-centers?${qs({ ...scope, search })}`)
      .then((r) => r.data),

  create: (body) =>
    apiClient
      .post<ContabilidadCostCenterDTO>(`/contabilidad-cost-centers?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  update: (id, body) =>
    apiClient
      .patch<ContabilidadCostCenterDTO>(
        `/contabilidad-cost-centers/${id}?${qs({ ...scope })}`,
        body,
      )
      .then((r) => r.data),

  deactivate: (id) =>
    apiClient
      .patch<ContabilidadCostCenterDTO>(
        `/contabilidad-cost-centers/${id}/deactivate?${qs({ ...scope })}`,
      )
      .then((r) => r.data),
}
