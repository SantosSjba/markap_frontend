import { apiClient } from '@core/api/apiClient'
import {
  INTERIORISMO_CONFIG_APP_SLUG,
  type InteriorismoConfigBootstrap,
  type InteriorismoProjectStageDTO,
} from '../../domain/config.types'
import type { InteriorismoConfigRepository } from '../../domain/repositories/interiorismo-config.repository'

const scope = { applicationSlug: INTERIORISMO_CONFIG_APP_SLUG } as const

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const interiorismoConfigApiRepository: InteriorismoConfigRepository = {
  bootstrap: () =>
    apiClient
      .get<InteriorismoConfigBootstrap>(`/interiorismo-config/bootstrap?${qs({ ...scope })}`)
      .then((r) => r.data),

  replaceProjectStages: (stages: InteriorismoProjectStageDTO[]) =>
    apiClient
      .put<InteriorismoProjectStageDTO[]>(`/interiorismo-config/project-stages?${qs({ ...scope })}`, {
        stages,
      })
      .then((r) => r.data),

  patchInteriorProjectNumbering: (body: { prefix?: string; lastNumber?: number }) =>
    apiClient
      .patch<InteriorismoConfigBootstrap['numbering']>(
        `/interiorismo-config/numbering/interior-project?${qs({ ...scope })}`,
        body,
      )
      .then((r) => r.data),
}
