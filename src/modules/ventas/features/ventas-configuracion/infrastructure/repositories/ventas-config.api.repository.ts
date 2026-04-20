import { apiClient } from '@core/api/apiClient'
import { VENTAS_CONFIG_APP_SLUG, type VentasConfigBootstrap, type VentasPipelineStageDTO } from '../../domain/config.types'
import type { VentasConfigRepository } from '../../domain/repositories/ventas-config.repository'

const scope = { applicationSlug: VENTAS_CONFIG_APP_SLUG } as const

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const ventasConfigApiRepository: VentasConfigRepository = {
  bootstrap: () =>
    apiClient
      .get<VentasConfigBootstrap>(`/ventas-config/bootstrap?${qs({ ...scope })}`)
      .then((r) => r.data),

  replacePipelineStages: (stages: VentasPipelineStageDTO[]) =>
    apiClient
      .put<VentasPipelineStageDTO[]>(`/ventas-config/pipeline-stages?${qs({ ...scope })}`, {
        stages,
      })
      .then((r) => r.data),

  patchSaleProcessNumbering: (body: { prefix?: string; lastNumber?: number }) =>
    apiClient
      .patch<VentasConfigBootstrap['numbering']>(
        `/ventas-config/numbering/sale-process?${qs({ ...scope })}`,
        body,
      )
      .then((r) => r.data),
}
