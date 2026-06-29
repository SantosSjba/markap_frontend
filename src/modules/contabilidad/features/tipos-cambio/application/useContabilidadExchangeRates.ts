import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@/shared/composables'
import { getApiErrorMessage } from '@/shared/utils/apiErrorMessage'
import { invalidateQuerySubtree } from '@/shared/utils/invalidateQuerySubtree'
import type { ListExchangeRatesParams, UpsertExchangeRateBody } from '../domain/exchange-rate.types'
import { contabilidadExchangeRatesApiRepository as exchangeRatesRepository } from '../infrastructure/repositories/contabilidad-exchange-rates.api.repository'

export const contabilidadExchangeRatesKeys = {
  root: ['contabilidad-exchange-rates'] as const,
  list: (params: ListExchangeRatesParams) =>
    [...contabilidadExchangeRatesKeys.root, 'list', params] as const,
}

export function invalidateContabilidadExchangeRatesCache(qc: QueryClient) {
  return invalidateQuerySubtree(qc, contabilidadExchangeRatesKeys.root)
}

export function useContabilidadExchangeRates(params: Ref<ListExchangeRatesParams>) {
  return useQuery({
    queryKey: computed(() => contabilidadExchangeRatesKeys.list(params.value)),
    queryFn: () => exchangeRatesRepository.listRates(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadUpsertExchangeRate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertExchangeRateBody) => exchangeRatesRepository.upsertRate(body),
    onSuccess: () => {
      void invalidateContabilidadExchangeRatesCache(qc)
      void markapAlert.toast.success('Tipo de cambio guardado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}
