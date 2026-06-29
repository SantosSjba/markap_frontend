import { apiClient } from '@core/api/apiClient'
import { CONTABILIDAD_EXCHANGE_RATES_APP_SLUG } from '../../domain/exchange-rate.types'
import type { ContabilidadExchangeRatesRepository } from '../../domain/repositories/contabilidad-exchange-rates.repository'

function qs(extra?: Record<string, string | undefined>) {
  const u = new URLSearchParams()
  u.set('applicationSlug', CONTABILIDAD_EXCHANGE_RATES_APP_SLUG)
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== '') u.set(k, String(v))
    })
  }
  return u.toString()
}

export const contabilidadExchangeRatesApiRepository: ContabilidadExchangeRatesRepository = {
  listRates: (params) =>
    apiClient
      .get(
        `/contabilidad-extensions/exchange-rates?${qs({
          dateFrom: params?.fromDate,
          dateTo: params?.toDate,
          currencyCode: params?.currencyCode,
        })}`,
      )
      .then((r) => r.data),

  upsertRate: (body) =>
    apiClient.put(`/contabilidad-extensions/exchange-rates?${qs()}`, body).then((r) => r.data),
}
