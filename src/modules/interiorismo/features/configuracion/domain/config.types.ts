export const INTERIORISMO_CONFIG_APP_SLUG = 'interiorismo' as const

export interface InteriorismoProjectStageDTO {
  code: string
  label: string
  sortOrder: number
  isActive: boolean
}

export interface InteriorismoConfigBootstrap {
  projectStages: InteriorismoProjectStageDTO[]
  numbering: {
    interiorProject: {
      prefix: string
      lastNumber: number
      nextPreview: string
    }
  }
}
