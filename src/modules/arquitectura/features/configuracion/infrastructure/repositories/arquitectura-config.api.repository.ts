import { apiClient } from '@core/api/apiClient'
import {
  ARQUITECTURA_CONFIG_APP_SLUG,
  type ArquitecturaConfigBootstrap,
  type ArquitecturaProjectStageDTO,
} from '../../domain/config.types'
import type { ArquitecturaConfigRepository } from '../../domain/repositories/arquitectura-config.repository'

const scope = { applicationSlug: ARQUITECTURA_CONFIG_APP_SLUG } as const

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const arquitecturaConfigApiRepository: ArquitecturaConfigRepository = {
  bootstrap: () =>
    apiClient
      .get<ArquitecturaConfigBootstrap>(`/arquitectura-config/bootstrap?${qs({ ...scope })}`)
      .then((r) => r.data),

  replaceProjectStages: (stages: ArquitecturaProjectStageDTO[]) =>
    apiClient
      .put<ArquitecturaProjectStageDTO[]>(`/arquitectura-config/project-stages?${qs({ ...scope })}`, {
        stages,
      })
      .then((r) => r.data),

  patchArquitecturaProjectNumbering: (body: { prefix?: string; lastNumber?: number }) =>
    apiClient
      .patch<ArquitecturaConfigBootstrap['numbering']>(
        `/arquitectura-config/numbering/arquitectura-project?${qs({ ...scope })}`,
        body,
      )
      .then((r) => r.data),
}
