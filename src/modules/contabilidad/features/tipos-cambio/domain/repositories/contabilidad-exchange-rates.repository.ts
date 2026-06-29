import type {
  ContabilidadExchangeRateDTO,
  ListExchangeRatesParams,
  UpsertExchangeRateBody,
} from '../exchange-rate.types'

export interface ContabilidadExchangeRatesRepository {
  listRates(params?: ListExchangeRatesParams): Promise<{ rates: ContabilidadExchangeRateDTO[] }>
  upsertRate(body: UpsertExchangeRateBody): Promise<ContabilidadExchangeRateDTO>
}
