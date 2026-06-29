import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_CONFIG_APP_SLUG } from '../../domain/config.types'
import type {
  ContabilidadAppSettingsDTO,
  ContabilidadCompanyProfileDTO,
  ContabilidadConfigBootstrap,
  ContabilidadDocumentSeriesDTO,
} from '../../domain/config.types'
import type { ContabilidadConfigRepository } from '../../domain/repositories/contabilidad-config.repository'

const scope = { applicationSlug: CONTABILIDAD_CONFIG_APP_SLUG } as const

function qs(params: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  return u.toString()
}

export const contabilidadConfigApiRepository: ContabilidadConfigRepository = {
  bootstrap: () =>
    apiClient
      .get<ContabilidadConfigBootstrap>(`/contabilidad-config/bootstrap?${qs({ ...scope })}`)
      .then((r) => r.data),

  updateCompany: (body) =>
    apiClient
      .put<ContabilidadCompanyProfileDTO>(`/contabilidad-config/company?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  updateSettings: (body) =>
    apiClient
      .put<ContabilidadAppSettingsDTO>(`/contabilidad-config/settings?${qs({ ...scope })}`, body)
      .then((r) => r.data),

  patchDocumentSeries: (seriesKey, body) =>
    apiClient
      .patch<ContabilidadDocumentSeriesDTO>(
        `/contabilidad-config/document-series/${seriesKey}?${qs({ ...scope })}`,
        body,
      )
      .then((r) => r.data),
}
