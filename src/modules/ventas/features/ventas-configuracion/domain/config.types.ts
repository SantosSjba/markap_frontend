export const VENTAS_CONFIG_APP_SLUG = 'ventas' as const

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
