import type { InteriorismoConfigBootstrap, InteriorismoProjectStageDTO } from '../config.types'
export interface InteriorismoConfigRepository {
  bootstrap: () => Promise<InteriorismoConfigBootstrap>
  replaceProjectStages: (
    stages: InteriorismoProjectStageDTO[],
  ) => Promise<InteriorismoProjectStageDTO[]>
}
