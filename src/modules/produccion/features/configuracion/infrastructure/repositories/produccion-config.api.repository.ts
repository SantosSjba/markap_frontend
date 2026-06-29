import { apiClient } from '@core/api/apiClient'
import { PRODUCCION_CONFIG_APP_SLUG } from '../../domain/config.types'
import type {
  ProduccionAppSettingsDTO,
  ProduccionConfigBootstrap,
  ProduccionFurnitureCategoryDTO,
  ProduccionProductionStageDTO,
  ProduccionUnitDTO,
  ProduccionNumberingSeriesDTO,
} from '../../domain/config.types'
import type { ProduccionConfigRepository } from '../../domain/repositories/produccion-config.repository'

const scope = { applicationSlug: PRODUCCION_CONFIG_APP_SLUG } as const

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const produccionConfigApiRepository: ProduccionConfigRepository = {
  bootstrap: () =>
    apiClient
      .get<ProduccionConfigBootstrap>(`/produccion-config/bootstrap?${qs({ ...scope })}`)
      .then((r) => r.data),

  updateSettings: (body) =>
    apiClient
      .put<ProduccionAppSettingsDTO>(`/produccion-config/settings?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  replaceFurnitureCategories: (categories) =>
    apiClient
      .put<ProduccionFurnitureCategoryDTO[]>(
        `/produccion-config/furniture-categories?${qs({ ...scope })}`,
        { categories },
      )
      .then((r) => r.data),

  replaceProductionStages: (stages) =>
    apiClient
      .put<ProduccionProductionStageDTO[]>(
        `/produccion-config/production-stages?${qs({ ...scope })}`,
        { stages },
      )
      .then((r) => r.data),

  replaceUnits: (units) =>
    apiClient
      .put<ProduccionUnitDTO[]>(`/produccion-config/units?${qs({ ...scope })}`, { units })
      .then((r) => r.data),

  patchNumbering: (seriesKey, body) =>
    apiClient
      .patch<ProduccionNumberingSeriesDTO>(
        `/produccion-config/numbering/${seriesKey}?${qs({ ...scope })}`,
        body,
      )
      .then((r) => r.data),
}
