export {
  useContabilidadConfigBootstrap,
  useContabilidadSaveCompany,
  useContabilidadSaveSettings,
  useContabilidadPatchDocumentSeries,
  contabilidadConfigKeys,
  invalidateContabilidadConfigCache,
} from './application/useContabilidadConfig'

export type {
  ContabilidadConfigBootstrap,
  ContabilidadCompanyProfileDTO,
  ContabilidadAppSettingsDTO,
  ContabilidadDocumentSeriesDTO,
} from './domain/config.types'

export { contabilidadConfiguracionRoutes } from './presentation/router'
