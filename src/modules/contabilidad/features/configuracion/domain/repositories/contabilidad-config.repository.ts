import type {
  ContabilidadAppSettingsDTO,
  ContabilidadCompanyProfileDTO,
  ContabilidadConfigBootstrap,
  ContabilidadDocumentSeriesDTO,
} from '../config.types'

export interface ContabilidadConfigRepository {
  bootstrap(): Promise<ContabilidadConfigBootstrap>
  updateCompany(body: Partial<ContabilidadCompanyProfileDTO>): Promise<ContabilidadCompanyProfileDTO>
  updateSettings(body: Partial<ContabilidadAppSettingsDTO>): Promise<ContabilidadAppSettingsDTO>
  patchDocumentSeries(
    seriesKey: string,
    body: { sunatSeries?: string; lastNumber?: number; padLength?: number; isActive?: boolean },
  ): Promise<ContabilidadDocumentSeriesDTO>
}
