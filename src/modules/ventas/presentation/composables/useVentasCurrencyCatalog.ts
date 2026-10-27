import { computed } from 'vue'
import { useVentasPropertyCurrencies } from '../../features/propiedades/presentation/composables/useVentasProperties'

/**
 * Monedas activas del catálogo (PEN, USD…) para los selectores de Ventas: inmuebles, procesos,
 * separaciones, comisiones y gastos usan la misma lista y las mismas etiquetas.
 */
export function useVentasCurrencyCatalog() {
  const { data: currencies, isLoading } = useVentasPropertyCurrencies()

  const options = computed(() =>
    (currencies.value ?? []).map((c) => ({ value: c.code, label: `${c.symbol} · ${c.name}` })),
  )

  function label(code: string | null | undefined): string {
    if (!code) return ''
    return options.value.find((o) => o.value === code)?.label ?? code
  }

  return { currencies, options, isLoading, label }
}
