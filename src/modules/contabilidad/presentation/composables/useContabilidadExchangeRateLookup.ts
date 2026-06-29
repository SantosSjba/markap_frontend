import { computed, type Ref } from 'vue'
import { useContabilidadExchangeRates } from '@modules/contabilidad/features/tipos-cambio/application/useContabilidadExchangeRates'
import { FUNCTIONAL_CURRENCY } from './useContabilidadCurrencies'

export function useContabilidadExchangeRateLookup(
  currencyCode: Ref<string>,
  rateDate: Ref<string>,
) {
  const params = computed(() => ({
    fromDate: rateDate.value || undefined,
    toDate: rateDate.value || undefined,
    currencyCode: currencyCode.value !== FUNCTIONAL_CURRENCY ? currencyCode.value : undefined,
  }))

  const { data, isLoading, isFetching } = useContabilidadExchangeRates(params)

  const sellRate = computed(() => {
    if (currencyCode.value === FUNCTIONAL_CURRENCY || !rateDate.value) return null
    const rate = (data.value?.rates ?? []).find(
      (r) => r.currencyCode === currencyCode.value && r.rateDate === rateDate.value,
    )
    return rate?.sellRate ?? null
  })

  return { sellRate, isLoading: computed(() => isLoading.value || isFetching.value) }
}
