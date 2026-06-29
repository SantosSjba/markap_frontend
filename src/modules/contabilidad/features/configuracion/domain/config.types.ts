import { CONTABILIDAD_APP_SLUG } from '@modules/contabilidad/config/app.constants'

export const CONTABILIDAD_CONFIG_APP_SLUG = CONTABILIDAD_APP_SLUG

export interface ContabilidadCompanyProfileDTO {
  ruc: string
  legalName: string
  tradeName: string | null
  fiscalAddress: string
  district: string
  province: string
  department: string
  ubigeoCode: string
}

export interface ContabilidadAppSettingsDTO {
  taxRegime: string
  isDetractionAgent: boolean
  isRetentionAgent: boolean
  isPerceptionAgent: boolean
  igvPercent: number
  currencyCode: string
  fiscalYearStartMonth: number
  amountDecimals: number
}

export interface ContabilidadDocumentSeriesDTO {
  seriesKey: string
  sunatSeries: string
  lastNumber: number
  padLength: number
  isActive: boolean
  nextPreview: string
}

export interface ContabilidadConfigBootstrap {
  company: ContabilidadCompanyProfileDTO
  settings: ContabilidadAppSettingsDTO
  documentSeries: ContabilidadDocumentSeriesDTO[]
}

export const CONTABILIDAD_TAX_REGIME_OPTIONS = [
  { value: 'GENERAL', label: 'Régimen general' },
  { value: 'RMT', label: 'Régimen MYPE tributario' },
  { value: 'MYPE', label: 'Régimen MYPE' },
  { value: 'NRUS', label: 'Nuevo RUS' },
] as const

export const CONTABILIDAD_FISCAL_MONTH_OPTIONS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
] as const

export const CONTABILIDAD_DOCUMENT_SERIES_LABELS: Record<string, string> = {
  SALES_INVOICE: 'Factura de venta',
  SALES_RECEIPT: 'Boleta de venta',
  SALES_CREDIT_NOTE: 'Nota de crédito (venta)',
  SALES_DEBIT_NOTE: 'Nota de débito (venta)',
}
