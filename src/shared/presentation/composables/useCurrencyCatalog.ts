import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { DIRECTORY } from '@shared/application/ports/directory.port'
import { useService } from '@shared/presentation/di/services'
import { formatMoney } from '@shared/utils/money'

export const currencyCatalogKeys = {
  list: () => ['shared-currencies'] as const,
}

/**
 * Monedas activas del catálogo (PEN, USD, EUR…) para selectores y montos de todos los módulos:
 * la misma lista, las mismas etiquetas y los mismos símbolos en Alquileres, Ventas e Interiorismo.
 */
export function useCurrencyCatalog() {
  const directory = useService(DIRECTORY)
  const { data: currencies, isLoading } = useQuery({
    queryKey: currencyCatalogKeys.list(),
    queryFn: () => directory.listCurrencies(),
    staleTime: Infinity,
  })

  const options = computed(() =>
    (currencies.value ?? []).map((c) => ({ value: c.code, label: `${c.symbol} · ${c.name}` })),
  )

  function symbol(code: string | null | undefined): string {
    if (!code) return ''
    return (currencies.value ?? []).find((c) => c.code === code)?.symbol ?? code
  }

  function label(code: string | null | undefined): string {
    if (!code) return ''
    return options.value.find((o) => o.value === code)?.label ?? code
  }

  function format(amount: number | null | undefined, code: string | null | undefined): string {
    return formatMoney(amount, code)
  }

  return { currencies, options, isLoading, symbol, label, format }
}
