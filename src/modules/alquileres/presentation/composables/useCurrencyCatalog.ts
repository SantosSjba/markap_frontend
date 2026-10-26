import { computed } from 'vue'
import { usePropertyCurrencies } from '../../features/propiedades/presentation/composables/useProperties'

/**
 * Monedas activas del catálogo (PEN, USD, EUR…) para selectores y montos de Alquileres:
 * propiedades, contratos y distribución financiera usan la misma lista y los mismos símbolos.
 */
export function useCurrencyCatalog() {
  const { data: currencies, isLoading } = usePropertyCurrencies()

  const options = computed(() =>
    (currencies.value ?? []).map((c) => ({ value: c.code, label: `${c.symbol} · ${c.name}` })),
  )

  function symbol(code: string | null | undefined): string {
    if (!code) return ''
    return (currencies.value ?? []).find((c) => c.code === code)?.symbol ?? code
  }

  function format(amount: number | null | undefined, code: string | null | undefined): string {
    const n = Number(amount ?? 0)
    return `${symbol(code)} ${n.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`
  }

  return { currencies, options, isLoading, symbol, format }
}
