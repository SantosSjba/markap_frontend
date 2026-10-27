import { apiClient } from '@shared/infrastructure/http/api-client'
import {
  VENTAS_CONFIG_APP_SLUG,
  type VentasConfigBootstrap,
  type VentasFinancingChannel,
  type VentasPipelineStageDTO,
} from '../../domain/config.types'
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

  listFinancingChannels: () =>
    apiClient
      .get<VentasFinancingChannel[]>(`/ventas-config/financing-channels?${qs({ ...scope })}`)
      .then((r) => r.data),

  createFinancingChannel: (body) =>
    apiClient
      .post<VentasFinancingChannel>(`/ventas-config/financing-channels?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  updateFinancingChannel: (id, body) =>
    apiClient
      .patch<VentasFinancingChannel>(
        `/ventas-config/financing-channels/${encodeURIComponent(id)}?${qs({ ...scope })}`,
        body,
      )
      .then((r) => r.data),
}
