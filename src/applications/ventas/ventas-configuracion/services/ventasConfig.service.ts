import { apiClient } from '@app/api/apiClient'

const scope = { applicationSlug: 'ventas' } as const

export interface VentasPipelineStageDTO {
  code: string
  label: string
  sortOrder: number
  isActive: boolean
}

export interface VentasConfigBootstrap {
  pipelineStages: VentasPipelineStageDTO[]
  numbering: {
    saleProcess: {
      prefix: string
      lastNumber: number
      nextPreview: string
    }
  }
  propertyTypes: { id: string; name: string; code: string }[]
}

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const ventasConfigService = {
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
