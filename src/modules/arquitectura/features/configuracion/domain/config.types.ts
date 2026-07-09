export const ARQUITECTURA_CONFIG_APP_SLUG = 'arquitectura' as const

export interface ArquitecturaProjectStageDTO {
  code: string
  label: string
  sortOrder: number
  isActive: boolean
}

export interface ArquitecturaConfigBootstrap {
  projectStages: ArquitecturaProjectStageDTO[]
  numbering: {
    arquitecturaProject: {
      prefix: string
      lastNumber: number
      nextPreview: string
    }
  }
}
