export const CONTABILIDAD_EXCHANGE_RATES_APP_SLUG = 'contabilidad'

export const DEFAULT_CURRENCY_CODE = 'USD'

export interface ContabilidadExchangeRateDTO {
  id: string
  rateDate: string
  currencyCode: string
  buyRate: string
  sellRate: string
  source: string | null
  createdAt: string
  updatedAt: string
}

export interface UpsertExchangeRateBody {
  rateDate: string
  currencyCode: string
  buyRate: number | string
  sellRate: number | string
  source?: string | null
}

export interface ListExchangeRatesParams {
  fromDate?: string
  toDate?: string
  currencyCode?: string
}
