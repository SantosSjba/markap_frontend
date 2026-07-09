import type { ArquitecturaConfigBootstrap, ArquitecturaProjectStageDTO } from '../config.types'

export interface ArquitecturaConfigRepository {
  bootstrap: () => Promise<ArquitecturaConfigBootstrap>
  replaceProjectStages: (stages: ArquitecturaProjectStageDTO[]) => Promise<ArquitecturaProjectStageDTO[]>
  patchArquitecturaProjectNumbering: (body: {
    prefix?: string
    lastNumber?: number
  }) => Promise<ArquitecturaConfigBootstrap['numbering']>
}
