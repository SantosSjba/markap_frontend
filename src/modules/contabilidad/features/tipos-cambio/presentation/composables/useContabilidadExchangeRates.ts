import { contabilidadExchangeRatesRepositoryKey as exchangeRatesRepositoryKey } from '../../application/ports/contabilidad-exchange-rates.port'
import { useService } from '@shared/presentation/di/services'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { markapAlert } from '@shared/presentation/composables/useMarkapAlert'
import { getApiErrorMessage } from '@shared/utils/apiErrorMessage'
import { invalidateModuleQueries } from '@shared/utils/invalidateModuleQueries'
import type {
  ListExchangeRatesParams,
  UpsertExchangeRateBody,
} from '../../domain/exchange-rate.types'
export const contabilidadExchangeRatesKeys = {
  root: ['contabilidad-exchange-rates'] as const,
  list: (params: ListExchangeRatesParams) =>
    [...contabilidadExchangeRatesKeys.root, 'list', params] as const,
}

export function invalidateContabilidadExchangeRatesCache(qc: QueryClient) {
  return invalidateModuleQueries(qc, 'contabilidad')
}

export function useContabilidadExchangeRates(params: Ref<ListExchangeRatesParams>) {
  const exchangeRatesRepository = useService(exchangeRatesRepositoryKey)
  return useQuery({
    queryKey: computed(() => contabilidadExchangeRatesKeys.list(params.value)),
    queryFn: () => exchangeRatesRepository.listRates(params.value),
    staleTime: 10_000,
  })
}

export function useContabilidadUpsertExchangeRate() {
  const exchangeRatesRepository = useService(exchangeRatesRepositoryKey)
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpsertExchangeRateBody) => exchangeRatesRepository.upsertRate(body),
    onSuccess: async () => {
      await invalidateContabilidadExchangeRatesCache(qc)
      void markapAlert.toast.success('Tipo de cambio guardado')
    },
    onError: (e) => void markapAlert.toast.error('No se pudo guardar', getApiErrorMessage(e)),
  })
}
